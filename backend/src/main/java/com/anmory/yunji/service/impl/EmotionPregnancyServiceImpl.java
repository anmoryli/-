package com.anmory.yunji.service.impl;

import com.anmory.yunji.dto.EmotionPregnancySummaryDto;
import com.anmory.yunji.dto.EmotionWeekDto;
import com.anmory.yunji.dto.SpouseEmotionSummaryDto;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.entity.MoodRecord;
import com.anmory.yunji.entity.UserDailyLog;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.MoodRecordMapper;
import com.anmory.yunji.mapper.UserDailyLogMapper;
import com.anmory.yunji.service.EmotionPregnancyService;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 情绪-孕周聚合：合并 memo 与 user_daily_log，按孕周汇总 mood、体重，并生成趋势与温暖话术。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionPregnancyServiceImpl implements EmotionPregnancyService {

    private static final Set<String> POSITIVE_MOODS = Set.of("happy", "calm", "peaceful");
    private static final Set<String> NEGATIVE_MOODS = Set.of("tired", "anxious");

    private final MemoMapper memoMapper;
    private final UserDailyLogMapper userDailyLogMapper;
    private final MoodRecordMapper moodRecordMapper;
    private final UserService userService;
    private final FamilyService familyService;
    private final PromptService promptService;

    @Override
    public EmotionPregnancySummaryDto getSummary(Integer creatorUserId) {
        EmotionPregnancySummaryDto out = new EmotionPregnancySummaryDto();
        out.setWeeks(new ArrayList<>());
        out.setWarmSentence("宝宝能感受到妈妈的情绪变化，每一笔记录都是爱的留痕。");
        out.setWeightInRangeHint(null);

        User creator = userService.getById(creatorUserId);
        if (creator == null) return out;
        LocalDate lmd = creator.getLastMenstrualDate();
        if (lmd == null && creator.getPregnancyTime() != null) {
            try {
                lmd = creator.getPregnancyTime().toLocalDate().minusDays(280);
            } catch (Exception ignored) {}
        }
        if (lmd == null) return out;

        final LocalDate lmdFinal = lmd;
        Map<Integer, WeekAccumulator> byWeek = new TreeMap<>();

        // 1) Memos: 按 pregnancy_week_index 或按 created_at 推算孕周
        List<Memo> memos = memoMapper.selectAllByUserId(creatorUserId);
        if (memos != null) {
            for (Memo m : memos) {
                int weekIdx = m.getPregnancyWeekIndex() != null
                        ? m.getPregnancyWeekIndex()
                        : PregnancyWeekUtil.getWeekIndex(lmdFinal, m.getCreatedAt() != null ? m.getCreatedAt().toLocalDate() : LocalDate.now());
                if (weekIdx < 0 || weekIdx > 52) continue;
                byWeek.computeIfAbsent(weekIdx, k -> new WeekAccumulator(k, lmdFinal)).addMemo(m);
            }
        }

        // 2) UserDailyLog: 按 record_date 推算孕周
        LocalDate end = LocalDate.now();
        LocalDate start = lmd;
        List<UserDailyLog> logs = userDailyLogMapper.findByUserAndDateRange(creatorUserId, start, end);
        if (logs != null) {
            for (UserDailyLog log : logs) {
                if (log.getRecordDate() == null) continue;
                int weekIdx = PregnancyWeekUtil.getWeekIndex(lmdFinal, log.getRecordDate());
                if (weekIdx < 0 || weekIdx > 52) continue;
                byWeek.computeIfAbsent(weekIdx, k -> new WeekAccumulator(k, lmdFinal)).addDailyLog(log);
            }
        }
        // 3) MoodRecord: 心情多次记录，供 AI 分析
        List<MoodRecord> moodRecords = moodRecordMapper.findByUserAndDateRange(creatorUserId, start, end);
        if (moodRecords != null) {
            for (MoodRecord mr : moodRecords) {
                if (mr.getRecordDate() == null) continue;
                int weekIdx = PregnancyWeekUtil.getWeekIndex(lmdFinal, mr.getRecordDate());
                if (weekIdx < 0 || weekIdx > 52) continue;
                byWeek.computeIfAbsent(weekIdx, k -> new WeekAccumulator(k, lmdFinal)).addMoodRecord(mr);
            }
        }

        for (WeekAccumulator acc : byWeek.values()) {
            EmotionWeekDto dto = acc.toDto();
            if (dto.getRecordCount() > 0 || (dto.getMoodDistribution() != null && !dto.getMoodDistribution().isEmpty())) {
                out.getWeeks().add(dto);
            }
        }

        if (!out.getWeeks().isEmpty()) {
            String warm = buildWarmSentence(out.getWeeks(), lmd);
            if (warm != null && !warm.isBlank()) out.setWarmSentence(warm);
            Boolean anyInRange = out.getWeeks().stream()
                    .map(EmotionWeekDto::getWeightInRange)
                    .filter(Objects::nonNull)
                    .reduce(false, (a, b) -> a || b);
            if (Boolean.TRUE.equals(anyInRange)) {
                out.setWeightInRangeHint("体重在合理范围内，别担心。");
            }
        }
        return out;
    }

    @Override
    public SpouseEmotionSummaryDto getSpouseSummary(Integer spouseUserId) {
        SpouseEmotionSummaryDto out = new SpouseEmotionSummaryDto();
        out.setTrend("stable");
        out.setLastWeeks(new ArrayList<>());
        out.setSuggestedAction("");

        Family family = familyService.getMyFamily(spouseUserId);
        if (family == null || family.getCreatorUserId() == null) return out;
        List<Integer> spouseIds = familyService.getSpouseUserIds(family.getCreatorUserId());
        if (spouseIds == null || !spouseIds.contains(spouseUserId)) return out;

        Integer creatorUserId = family.getCreatorUserId();
        EmotionPregnancySummaryDto summary = getSummary(creatorUserId);
        if (summary.getWeeks() == null || summary.getWeeks().isEmpty()) {
            out.setSuggestedAction("多记录几天后，这里会显示妻子的情绪趋势与关怀建议。");
            return out;
        }

        String trend = computeTrend(creatorUserId);
        out.setTrend(trend);

        List<EmotionWeekDto> last = summary.getWeeks().stream()
                .sorted((a, b) -> Integer.compare(b.getPregnancyWeekIndex() != null ? b.getPregnancyWeekIndex() : 0,
                        a.getPregnancyWeekIndex() != null ? a.getPregnancyWeekIndex() : 0))
                .limit(5)
                .toList();
        for (EmotionWeekDto w : last) {
            String desc = describeWeekMood(w);
            out.getLastWeeks().add(w.getWeekLabel() + "：" + desc);
        }

        if ("fluctuating".equals(trend) || "need_support".equals(trend)) {
            out.setSuggestedAction("老婆这周情绪波动稍大，今晚可以多陪她说说话。");
        } else {
            out.setSuggestedAction("近几周情绪平稳，继续保持关心与陪伴就好。");
        }
        return out;
    }

    @Override
    public String computeTrend(Integer creatorUserId) {
        EmotionPregnancySummaryDto summary = getSummary(creatorUserId);
        if (summary.getWeeks() == null || summary.getWeeks().size() < 2) return "stable";
        List<EmotionWeekDto> sorted = summary.getWeeks().stream()
                .sorted((a, b) -> Integer.compare(
                        b.getPregnancyWeekIndex() != null ? b.getPregnancyWeekIndex() : 0,
                        a.getPregnancyWeekIndex() != null ? a.getPregnancyWeekIndex() : 0))
                .limit(4)
                .toList();
        double negativeRatioLast = 0;
        int weeksWithData = 0;
        for (EmotionWeekDto w : sorted) {
            Map<String, Integer> dist = w.getMoodDistribution();
            if (dist == null || dist.isEmpty()) continue;
            int total = dist.values().stream().mapToInt(Integer::intValue).sum();
            if (total == 0) continue;
            int neg = dist.entrySet().stream()
                    .filter(e -> NEGATIVE_MOODS.contains(e.getKey()))
                    .mapToInt(Map.Entry::getValue)
                    .sum();
            negativeRatioLast += (double) neg / total;
            weeksWithData++;
        }
        if (weeksWithData == 0) return "stable";
        double avgNeg = negativeRatioLast / weeksWithData;
        if (avgNeg >= 0.5) return "need_support";
        if (avgNeg >= 0.3) return "fluctuating";
        return "stable";
    }

    private String describeWeekMood(EmotionWeekDto w) {
        Map<String, Integer> dist = w.getMoodDistribution();
        if (dist == null || dist.isEmpty()) return "暂无记录";
        int total = dist.values().stream().mapToInt(Integer::intValue).sum();
        if (total == 0) return "暂无记录";
        long pos = dist.entrySet().stream().filter(e -> POSITIVE_MOODS.contains(e.getKey())).mapToInt(Map.Entry::getValue).sum();
        long neg = dist.entrySet().stream().filter(e -> NEGATIVE_MOODS.contains(e.getKey())).mapToInt(Map.Entry::getValue).sum();
        if (neg >= total / 2) return "情绪波动较大";
        if (pos >= total / 2) return "情绪平稳";
        return "情绪平稳";
    }

    private String buildWarmSentence(List<EmotionWeekDto> weeks, LocalDate lmd) {
        try {
            int currentWeek = PregnancyWeekUtil.getWeekIndex(lmd, LocalDate.now());
            String weekStr = String.valueOf(currentWeek);
            EmotionWeekDto last = weeks.stream()
                    .filter(w -> w.getPregnancyWeekIndex() != null)
                    .max(Comparator.comparing(EmotionWeekDto::getPregnancyWeekIndex))
                    .orElse(null);
            String moodSummary = "以开心、平静为主";
            if (last != null && last.getMoodDistribution() != null && !last.getMoodDistribution().isEmpty()) {
                String top = last.getMoodDistribution().entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(e -> moodLabel(e.getKey()))
                        .orElse("平静");
                moodSummary = "以" + top + "为主";
            }
            String weightInRange = "true";
            Map<String, String> params = new HashMap<>();
            params.put("week", weekStr);
            params.put("moodSummary", moodSummary);
            params.put("weightInRange", weightInRange);
            String prompt = promptService.getUserPrompt("emotion_pregnancy_warm_sentence", "default", params);
            if (prompt != null && !prompt.isBlank()) {
                return prompt;
            }
        } catch (Exception e) {
            log.debug("buildWarmSentence failed", e);
        }
        return "宝宝能感受到妈妈的情绪变化，每一笔记录都是爱的留痕。";
    }

    private static String moodLabel(String key) {
        if (key == null) return "平静";
        return switch (key) {
            case "happy" -> "开心";
            case "calm" -> "平静";
            case "tired" -> "疲惫";
            case "anxious" -> "焦虑";
            case "peaceful" -> "安心";
            case "excited" -> "兴奋";
            case "grateful" -> "感恩";
            case "sleepy" -> "困倦";
            case "energetic" -> "精力充沛";
            case "sad" -> "难过";
            case "worried" -> "担忧";
            case "relaxed" -> "放松";
            case "stressed" -> "紧张";
            case "nervous" -> "忐忑";
            case "joyful" -> "喜悦";
            case "content" -> "满足";
            case "irritable" -> "烦躁";
            case "expectant" -> "期待";
            default -> key;
        };
    }

    private static class WeekAccumulator {
        private final int weekIndex;
        private final LocalDate lmd;
        private final Map<String, Integer> moodCount = new HashMap<>();
        private int recordCount;
        private double weightSum;
        private int weightCount;

        WeekAccumulator(int weekIndex, LocalDate lmd) {
            this.weekIndex = weekIndex;
            this.lmd = lmd;
        }

        void addMemo(Memo m) {
            recordCount++;
            if (m.getMood() != null && !m.getMood().isBlank()) {
                moodCount.merge(m.getMood().trim().toLowerCase(), 1, Integer::sum);
            }
            if (m.getRecordWeightKg() != null) {
                weightSum += m.getRecordWeightKg();
                weightCount++;
            }
        }

        void addDailyLog(UserDailyLog l) {
            if (l.getMood() != null && !l.getMood().isBlank()) {
                moodCount.merge(l.getMood().trim().toLowerCase(), 1, Integer::sum);
            }
            if (l.getWeightKg() != null) {
                weightSum += l.getWeightKg();
                weightCount++;
            }
        }

        void addMoodRecord(MoodRecord mr) {
            if (mr.getMood() != null && !mr.getMood().isBlank()) {
                moodCount.merge(mr.getMood().trim().toLowerCase(), 1, Integer::sum);
            }
        }

        EmotionWeekDto toDto() {
            EmotionWeekDto dto = new EmotionWeekDto();
            dto.setPregnancyWeekIndex(weekIndex);
            dto.setWeekLabel("孕" + weekIndex + "周");
            dto.setMoodDistribution(moodCount.isEmpty() ? null : new HashMap<>(moodCount));
            dto.setRecordCount(recordCount);
            dto.setAvgWeightKg(weightCount > 0 ? weightSum / weightCount : null);
            dto.setWeightInRange(weightCount > 0 ? true : null);
            return dto;
        }
    }

    @Override
    public String getLastWeekSummary(Integer userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(7);
        int memoCount = 0;
        try {
            memoCount = memoMapper.countByUserAndDateRange(userId, start, end);
        } catch (Exception e) {
            log.debug("getLastWeekSummary countByUserAndDateRange failed", e);
        }
        List<String> parts = new ArrayList<>();
        parts.add("上周记录" + memoCount + "条");
        List<UserDailyLog> logs = userDailyLogMapper.findByUserAndDateRange(userId, start, end);
        Map<String, Integer> moodCounts = new HashMap<>();
        if (logs != null && !logs.isEmpty()) {
            long withWeight = logs.stream().filter(l -> l.getWeightKg() != null && l.getWeightKg() > 0).count();
            if (withWeight > 0) parts.add("体重有记录");
            for (UserDailyLog log : logs) {
                if (log.getMood() != null && !log.getMood().isBlank()) {
                    moodCounts.merge(log.getMood().toLowerCase(), 1, Integer::sum);
                }
            }
        }
        List<MoodRecord> moodRecords = moodRecordMapper.findByUserAndDateRange(userId, start, end);
        if (moodRecords != null) {
            for (MoodRecord mr : moodRecords) {
                if (mr.getMood() != null && !mr.getMood().isBlank()) {
                    moodCounts.merge(mr.getMood().toLowerCase(), 1, Integer::sum);
                }
            }
        }
        if (!moodCounts.isEmpty()) {
            String topMood = moodCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse(null);
            if (topMood != null) {
                parts.add("心情以" + moodLabel(topMood) + "为主");
            }
        }
        return String.join("，", parts);
    }
}
