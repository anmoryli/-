package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.PregnancyGoalTemplate;
import com.anmory.yunji.entity.UserAchievement;
import com.anmory.yunji.entity.UserGoalProgress;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.PhotoMapper;
import com.anmory.yunji.mapper.PregnancyGoalTemplateMapper;
import com.anmory.yunji.mapper.UserAchievementMapper;
import com.anmory.yunji.mapper.UserDailyLogMapper;
import com.anmory.yunji.mapper.UserGoalProgressMapper;
import com.anmory.yunji.service.GoalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoalServiceImpl implements GoalService {

    private final PregnancyGoalTemplateMapper templateMapper;
    private final UserGoalProgressMapper progressMapper;
    private final UserAchievementMapper achievementMapper;
    private final MemoMapper memoMapper;
    private final PhotoMapper photoMapper;
    private final UserDailyLogMapper userDailyLogMapper;

    @Override
    public List<PregnancyGoalTemplate> getTemplates() {
        return templateMapper.selectAll();
    }

    @Override
    public List<Map<String, Object>> getProgressWithTemplates(Integer userId) {
        List<PregnancyGoalTemplate> templates = templateMapper.selectAll();
        List<UserGoalProgress> progressList = progressMapper.selectByUserId(userId);
        Map<Integer, UserGoalProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(UserGoalProgress::getTemplateId, p -> p));

        List<Map<String, Object>> result = new ArrayList<>();
        for (PregnancyGoalTemplate t : templates) {
            int currentValue = computeCurrentValue(userId, t);
            UserGoalProgress p = progressMap.get(t.getTemplateId());
            if (p != null && "completed".equals(p.getStatus())) {
                currentValue = Math.max(currentValue, p.getCurrentValue());
            }

            Map<String, Object> row = new HashMap<>();
            row.put("templateId", t.getTemplateId());
            row.put("templateName", t.getName());
            row.put("description", t.getDescription());
            row.put("category", t.getCategory());
            row.put("targetValue", t.getTargetValue());
            row.put("unit", t.getUnit());
            row.put("points", t.getPoints());
            row.put("currentValue", currentValue);
            row.put("status", (p != null && "completed".equals(p.getStatus())) ? "completed" : "active");
            row.put("completedAt", p != null ? p.getCompletedAt() : null);
            result.add(row);
        }
        return result;
    }

    private int computeCurrentValue(Integer userId, PregnancyGoalTemplate t) {
        String key = t.getTrackKey();
        switch (key) {
            case "daily_record":
                return memoMapper.countByUserAndDate(userId, LocalDate.now()) >= 1 ? 1 : 0;
            case "letters":
                return memoMapper.countByUserAndTag(userId, "letter_to_baby");
            case "photos":
                return photoMapper.countByUserId(userId);
            case "streak_days":
                return computeStreak(userId);
            case "kicks":
                return userDailyLogMapper.sumKickCountByUserId(userId);
            case "week20_record":
                return memoMapper.countByUserAndWeek20(userId) >= 1 ? 1 : 0;
            case "first_letter":
                return memoMapper.countByUserAndTag(userId, "letter_to_baby") >= 1 ? 1 : 0;
            default:
                return 0;
        }
    }

    private int computeStreak(Integer userId) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(60);
        List<LocalDate> dates = memoMapper.selectDistinctRecordDates(userId, from);
        if (dates == null || dates.isEmpty()) return 0;
        int streak = 0;
        LocalDate expect = today;
        for (LocalDate d : dates) {
            if (d.equals(expect)) {
                streak++;
                expect = expect.minusDays(1);
            } else if (d.isBefore(expect)) {
                break;
            }
        }
        return streak;
    }

    @Override
    public List<UserAchievement> getAchievements(Integer userId) {
        return achievementMapper.selectByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void onRecordAdded(Integer userId, String tag, String pregnancyWeek, int photoCount) {
        List<PregnancyGoalTemplate> templates = templateMapper.selectAll();
        for (PregnancyGoalTemplate t : templates) {
            if ("completed".equals(getProgressStatus(userId, t.getTemplateId()))) continue;
            int current = computeCurrentValue(userId, t);
            if (current >= t.getTargetValue()) {
                completeGoal(userId, t, current);
            } else {
                upsertProgress(userId, t.getTemplateId(), current);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void onKickIncremented(Integer userId) {
        List<PregnancyGoalTemplate> templates = templateMapper.selectAll();
        for (PregnancyGoalTemplate t : templates) {
            if (!"kicks".equals(t.getTrackKey())) continue;
            if ("completed".equals(getProgressStatus(userId, t.getTemplateId()))) continue;
            int current = computeCurrentValue(userId, t);
            if (current >= t.getTargetValue()) {
                completeGoal(userId, t, current);
            } else {
                upsertProgress(userId, t.getTemplateId(), current);
            }
        }
    }

    private String getProgressStatus(Integer userId, Integer templateId) {
        UserGoalProgress p = progressMapper.findByUserAndTemplate(userId, templateId);
        return p != null ? p.getStatus() : "active";
    }

    private void completeGoal(Integer userId, PregnancyGoalTemplate t, int currentValue) {
        UserGoalProgress p = progressMapper.findByUserAndTemplate(userId, t.getTemplateId());
        if (p == null) {
            p = new UserGoalProgress();
            p.setUserId(userId);
            p.setTemplateId(t.getTemplateId());
            p.setCurrentValue(currentValue);
            p.setStatus("completed");
            p.setCompletedAt(java.time.LocalDateTime.now());
            progressMapper.insert(p);
        } else if (!"completed".equals(p.getStatus())) {
            p.setCurrentValue(currentValue);
            p.setStatus("completed");
            p.setCompletedAt(java.time.LocalDateTime.now());
            progressMapper.update(p);
        }
        UserAchievement a = new UserAchievement();
        a.setUserId(userId);
        a.setBadgeKey("goal_" + t.getTrackKey());
        a.setBadgeName(t.getName());
        achievementMapper.insert(a);
    }

    private void upsertProgress(Integer userId, Integer templateId, int currentValue) {
        UserGoalProgress p = progressMapper.findByUserAndTemplate(userId, templateId);
        if (p == null) {
            p = new UserGoalProgress();
            p.setUserId(userId);
            p.setTemplateId(templateId);
            p.setCurrentValue(currentValue);
            p.setStatus("active");
            progressMapper.insert(p);
        } else if ("active".equals(p.getStatus())) {
            p.setCurrentValue(currentValue);
            progressMapper.update(p);
        }
    }
}
