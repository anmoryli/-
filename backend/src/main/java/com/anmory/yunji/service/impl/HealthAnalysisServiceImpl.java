package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.FetalUltrasoundRecord;
import com.anmory.yunji.entity.HealthAnalysisRecord;
import com.anmory.yunji.entity.PregnancyWeightRecord;
import com.anmory.yunji.health.FetalReference;
import com.anmory.yunji.health.WeightReference;
import com.anmory.yunji.mapper.HealthAnalysisRecordMapper;
import com.anmory.yunji.mapper.PregnancyWeightRecordMapper;
import com.anmory.yunji.service.HealthAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthAnalysisServiceImpl implements HealthAnalysisService {

    private static final String FETAL_SYSTEM_PROMPT = "你是孕期B超解读顾问。根据孕周与胎儿大小对照表，对比用户B超数据，给出2-3句简洁、积极、可执行的建议。输出纯文本，语气温暖。若数据在参考范围内，肯定并鼓励；若有偏离，温和提醒并建议产检复核。";
    private static final String WEIGHT_SYSTEM_PROMPT = "你是孕期健康顾问，根据用户数据给出简洁、积极、可执行的建议。输出纯文本，2-4 句话，语气温暖鼓励。";

    private static final String FETAL_REF_TABLE = "孕周与胎儿大小对照表(参考): 12周BPD15/HC56/AC51/FL7/EFW9g, 13周19/72/63/10/19, 14周24/89/75/14/38, 15周28/105/87/17/62, 16周32/120/100/20/95, 17周36/135/112/23/136, 18周39/149/124/26/183, 19周43/162/135/29/243, 20周46/175/147/32/311, 21周50/187/159/35/399, 22周53/198/170/37/480, 23周56/209/182/40/585, 24周59/220/193/43/700, 25周62/230/204/45/816, 26周64/239/215/48/946, 27周67/249/226/50/1087, 28周70/258/237/53/1260, 29周72/266/248/55/1414, 30周75/275/258/57/1589, 31周77/283/269/60/1790, 32周80/290/279/62/1995, 33周82/298/290/64/2204, 34周85/305/300/66/2439, 35周87/312/311/68/2677, 36周89/319/321/70/2918, 37周91/326/331/72/3172, 38周93/333/341/74/3442, 39周96/339/351/76/3775, 40周98/345/361/78/4056。单位:mm/g。允许±10%浮动。";

    private final OpenAiChatModel openAiChatModel;
    private final HealthAnalysisRecordMapper healthAnalysisRecordMapper;
    private final PregnancyWeightRecordMapper pregnancyWeightRecordMapper;

    @Override
    @Async
    public void analyzeAndSaveWeight(Integer userId, PregnancyWeightRecord record) {
        log.info("[健康分析] analyzeAndSaveWeight 开始 userId={} recordId={} gestationWeek={} weightKg={}", userId, record != null ? record.getId() : null, record != null ? record.getGestationWeek() : null, record != null ? record.getWeightKg() : null);
        if (record == null || record.getId() == null || record.getGestationWeek() == null || record.getWeightKg() == null) {
            log.warn("[健康分析] analyzeAndSaveWeight 跳过：记录不完整 record={}", record);
            return;
        }
        try {
            PregnancyWeightRecord baseline = pregnancyWeightRecordMapper.firstByUserId(userId);
            if (baseline == null || baseline.getWeightKg() == null) {
                log.warn("[健康分析] analyzeAndSaveWeight 跳过：无首次体重基线 userId={}", userId);
                return;
            }
            BigDecimal gain = record.getWeightKg().subtract(baseline.getWeightKg()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal suggested = WeightReference.suggestedGainKg(record.getGestationWeek());
            BigDecimal[] range = WeightReference.rangeForSuggested(suggested);
            String status = WeightReference.statusOf(gain, range[0], range[1]);

            String prompt = String.format(
                    "孕周：%d 周；当前体重：%s kg；相对首次增重：%s kg；标准范围：%s - %s kg；状态：%s。请给出简洁积极的建议。",
                    record.getGestationWeek(),
                    record.getWeightKg(),
                    gain,
                    range[0],
                    range[1],
                    statusDesc(status)
            );

            log.info("[健康分析] 体重 prompt 长度={} 内容={}", prompt.length(), prompt);

            String analysisText = ChatClient.builder(openAiChatModel)
                    .defaultSystem(WEIGHT_SYSTEM_PROMPT)
                    .build()
                    .prompt()
                    .user(prompt)
                    .call()
                    .content();

            log.info("[健康分析] 体重 AI 返回 长度={} 有内容={}", analysisText != null ? analysisText.length() : 0, analysisText != null && !analysisText.isBlank());
            if (analysisText != null && !analysisText.isBlank()) {
                HealthAnalysisRecord ar = new HealthAnalysisRecord();
                ar.setUserId(userId);
                ar.setRecordType("weight");
                ar.setRecordId(record.getId());
                ar.setGestationWeek(record.getGestationWeek());
                ar.setAnalysisText(analysisText.trim());
                healthAnalysisRecordMapper.insert(ar);
                log.info("[健康分析] 体重分析已保存 recordId={} analysisId={}", record.getId(), ar.getId());
            } else {
                log.warn("[健康分析] 体重 AI 返回为空 recordId={}", record.getId());
            }
        } catch (Exception e) {
            log.error("[健康分析] AI 体重分析失败 userId={} recordId={}", userId, record.getId(), e);
        }
    }

    @Override
    @Async
    public void analyzeAndSaveFetal(Integer userId, FetalUltrasoundRecord record) {
        log.info("[健康分析] analyzeAndSaveFetal 异步开始 userId={} recordId={} gestationWeek={} bpd={} hc={} ac={} fl={} efw={}",
                userId, record != null ? record.getId() : null, record != null ? record.getGestationWeek() : null,
                record != null ? record.getBpdMm() : null, record != null ? record.getHcMm() : null,
                record != null ? record.getAcMm() : null, record != null ? record.getFlMm() : null,
                record != null ? record.getEfwG() : null);
        HealthAnalysisRecord ar = doAnalyzeFetal(userId, record);
        if (ar != null) {
            healthAnalysisRecordMapper.insert(ar);
            log.info("[健康分析] B超分析已保存 recordId={} analysisId={}", record.getId(), ar.getId());
        } else {
            log.warn("[健康分析] B超分析未生成 recordId={}", record != null ? record.getId() : null);
        }
    }

    @Override
    public HealthAnalysisRecord analyzeFetalSync(Integer userId, FetalUltrasoundRecord record, int timeoutSeconds) {
        log.info("[健康分析] analyzeFetalSync 开始 userId={} recordId={} gestationWeek={} timeout={}s",
                userId, record != null ? record.getId() : null, record != null ? record.getGestationWeek() : null, timeoutSeconds);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<HealthAnalysisRecord> future = executor.submit(() -> {
                HealthAnalysisRecord ar = doAnalyzeFetal(userId, record);
                if (ar != null) {
                    healthAnalysisRecordMapper.insert(ar);
                    log.info("[健康分析] B超同步分析已保存 recordId={} analysisId={}", record.getId(), ar.getId());
                }
                return ar;
            });
            return future.get(timeoutSeconds, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            log.warn("[健康分析] B超同步分析超时 recordId={} 将转为异步", record != null ? record.getId() : null);
            analyzeAndSaveFetal(userId, record);
            return null;
        } catch (Exception e) {
            log.error("[健康分析] B超同步分析异常 recordId={}", record != null ? record.getId() : null, e);
            return null;
        } finally {
            executor.shutdown();
        }
    }

    private HealthAnalysisRecord doAnalyzeFetal(Integer userId, FetalUltrasoundRecord record) {
        if (record == null || record.getId() == null) {
            log.warn("[健康分析] doAnalyzeFetal 跳过：record 或 id 为空");
            return null;
        }
        Integer week = record.getGestationWeek();
        if (week == null || week < 1 || week > 45) {
            log.warn("[健康分析] doAnalyzeFetal 跳过：孕周无效 gestationWeek={}", week);
            return null;
        }
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append(FETAL_REF_TABLE).append("\n");
            prompt.append("【用户B超记录】孕").append(week).append("周。");
            if (record.getBpdMm() != null) prompt.append("BPD=").append(record.getBpdMm()).append("mm ");
            if (record.getHcMm() != null) prompt.append("HC=").append(record.getHcMm()).append("mm ");
            if (record.getAcMm() != null) prompt.append("AC=").append(record.getAcMm()).append("mm ");
            if (record.getFlMm() != null) prompt.append("FL=").append(record.getFlMm()).append("mm ");
            if (record.getEfwG() != null) prompt.append("EFW=").append(record.getEfwG()).append("g ");
            if (record.getNote() != null && !record.getNote().isBlank()) prompt.append("备注:").append(record.getNote().trim()).append(" ");
            prompt.append("。请对照上述参考表，给出2-3句简洁建议。");

            String promptStr = prompt.toString();
            log.info("[健康分析] B超 prompt 长度={} 内容={}", promptStr.length(), promptStr);

            String analysisText = ChatClient.builder(openAiChatModel)
                    .defaultSystem(FETAL_SYSTEM_PROMPT)
                    .build()
                    .prompt()
                    .user(promptStr)
                    .call()
                    .content();

            log.info("[健康分析] B超 AI 返回 长度={} 有内容={}", analysisText != null ? analysisText.length() : 0, analysisText != null && !analysisText.isBlank());
            if (analysisText != null && !analysisText.isBlank()) {
                HealthAnalysisRecord ar = new HealthAnalysisRecord();
                ar.setUserId(userId);
                ar.setRecordType("fetal");
                ar.setRecordId(record.getId());
                ar.setGestationWeek(week);
                ar.setAnalysisText(analysisText.trim());
                return ar;
            }
            log.warn("[健康分析] B超 AI 返回为空 recordId={}", record.getId());
            return null;
        } catch (Exception e) {
            log.error("[健康分析] B超 AI 调用异常 recordId={}", record.getId(), e);
            return null;
        }
    }

    @Override
    public List<HealthAnalysisRecord> listAnalysisHistory(Integer userId, int limit) {
        log.info("[健康分析] listAnalysisHistory userId={} limit={}", userId, limit);
        if (userId == null) return List.of();
        var list = healthAnalysisRecordMapper.listByUserId(userId, limit);
        log.info("[健康分析] listAnalysisHistory 返回 {} 条", list != null ? list.size() : 0);
        return list;
    }

    @Override
    public HealthAnalysisRecord getAnalysisByRecord(Integer userId, String recordType, Long recordId) {
        log.info("[健康分析] getAnalysisByRecord userId={} recordType={} recordId={}", userId, recordType, recordId);
        if (userId == null || recordType == null || recordId == null) return null;
        return healthAnalysisRecordMapper.selectByRecord(userId, recordType, recordId);
    }

    private static String statusDesc(String status) {
        return switch (status != null ? status : "unknown") {
            case "below" -> "偏低";
            case "above" -> "偏高";
            case "within" -> "在参考范围内";
            default -> "未知";
        };
    }
}
