package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.FetalUltrasoundRecord;
import com.anmory.yunji.entity.PregnancyWeightRecord;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.health.FetalReference;
import com.anmory.yunji.health.WeightReference;
import com.anmory.yunji.mapper.FetalUltrasoundRecordMapper;
import com.anmory.yunji.mapper.PregnancyWeightRecordMapper;
import com.anmory.yunji.service.FetalPdfService;
import com.anmory.yunji.service.HealthAnalysisService;
import com.anmory.yunji.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final UserService userService;
    private final PregnancyWeightRecordMapper pregnancyWeightRecordMapper;
    private final FetalUltrasoundRecordMapper fetalUltrasoundRecordMapper;
    private final HealthAnalysisService healthAnalysisService;
    private final FetalPdfService fetalPdfService;

    @PostMapping("/weightRecords")
    public Result<PregnancyWeightRecord> addWeightRecord(@RequestParam("userId") Integer userId,
                                                         @RequestParam(value = "recordDate", required = false) LocalDate recordDate,
                                                         @RequestParam(value = "gestationWeek", required = false) Integer gestationWeek,
                                                         @RequestParam("weightKg") BigDecimal weightKg,
                                                         @RequestParam(value = "note", required = false) String note) {
        log.info("[健康] addWeightRecord 请求 userId={} recordDate={} gestationWeek={} weightKg={}", userId, recordDate, gestationWeek, weightKg);
        if (recordDate == null) recordDate = LocalDate.now();
        if (weightKg == null) return Result.error(400, "BAD_REQUEST", "请填写体重");
        if (weightKg.compareTo(BigDecimal.ZERO) <= 0 || weightKg.compareTo(new BigDecimal("300")) > 0) {
            log.warn("[健康] 体重超出合理范围 weightKg={}", weightKg);
            return Result.error(400, "BAD_REQUEST", "体重需在 0.1～300 kg 之间，请检查是否填写正确（单位：公斤）");
        }
        PregnancyWeightRecord r = new PregnancyWeightRecord();
        r.setUserId(userId);
        r.setRecordDate(recordDate);
        r.setGestationWeek(resolveGestationWeek(userId, recordDate, gestationWeek));
        r.setWeightKg(weightKg.setScale(2, RoundingMode.HALF_UP));
        r.setNote(note != null && !note.isBlank() ? note.trim() : null);
        pregnancyWeightRecordMapper.insert(r);
        log.info("[健康] 体重记录已插入 recordId={} gestationWeek={}", r.getId(), r.getGestationWeek());
        healthAnalysisService.analyzeAndSaveWeight(userId, r);
        log.info("[健康] 已触发异步 AI 体重分析 recordId={}", r.getId());
        return Result.success(r);
    }

    @GetMapping("/weightRecords")
    public Result<List<Map<String, Object>>> listWeightRecords(@RequestParam("userId") Integer userId) {
        List<PregnancyWeightRecord> records = pregnancyWeightRecordMapper.listByUserId(userId);
        PregnancyWeightRecord baseline = pregnancyWeightRecordMapper.firstByUserId(userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (PregnancyWeightRecord r : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("record", r);
            if (baseline != null && baseline.getWeightKg() != null && r.getWeightKg() != null && r.getGestationWeek() != null) {
                BigDecimal gain = r.getWeightKg().subtract(baseline.getWeightKg());
                BigDecimal suggested = WeightReference.suggestedGainKg(r.getGestationWeek());
                BigDecimal[] range = WeightReference.rangeForSuggested(suggested);
                String status = WeightReference.statusOf(gain, range[0], range[1]);
                item.put("baselineWeightKg", baseline.getWeightKg());
                item.put("gainKg", gain.setScale(2, RoundingMode.HALF_UP));
                item.put("suggestedGainKg", suggested);
                item.put("range", Map.of("min", range[0], "max", range[1]));
                item.put("status", status);
                item.put("advice", WeightReference.advice(status, r.getGestationWeek()));
            }
            out.add(item);
        }
        return Result.success(out);
    }

    @PostMapping("/fetalRecords/parsePdf")
    public Result<FetalUltrasoundRecord> parseFetalPdf(@RequestParam("userId") Integer userId,
                                                       @RequestParam("file") MultipartFile file) {
        log.info("[健康] parseFetalPdf 请求 userId={} fileName={}", userId, file != null ? file.getOriginalFilename() : null);
        if (file == null || file.isEmpty()) {
            return Result.error(400, "BAD_REQUEST", "请选择 PDF 文件");
        }
        FetalUltrasoundRecord record = fetalPdfService.parseOnly(userId, file);
        if (record == null) {
            return Result.error(400, "PARSE_FAILED", "B超 PDF 解析失败，请尝试手动录入或检查文件格式");
        }
        return Result.success(record);
    }

    @PostMapping("/fetalRecords")
    public Result<FetalUltrasoundRecord> addFetalRecord(@RequestParam("userId") Integer userId,
                                                        @RequestParam(value = "recordDate", required = false) LocalDate recordDate,
                                                        @RequestParam(value = "gestationWeek", required = false) Integer gestationWeek,
                                                        @RequestParam(value = "bpdMm", required = false) BigDecimal bpdMm,
                                                        @RequestParam(value = "hcMm", required = false) BigDecimal hcMm,
                                                        @RequestParam(value = "acMm", required = false) BigDecimal acMm,
                                                        @RequestParam(value = "flMm", required = false) BigDecimal flMm,
                                                        @RequestParam(value = "efwG", required = false) Integer efwG,
                                                        @RequestParam(value = "note", required = false) String note) {
        if (recordDate == null) recordDate = LocalDate.now();
        Integer week = resolveGestationWeek(userId, recordDate, gestationWeek);
        FetalUltrasoundRecord r = new FetalUltrasoundRecord();
        r.setUserId(userId);
        r.setRecordDate(recordDate);
        r.setGestationWeek(week);
        r.setBpdMm(scale2(bpdMm));
        r.setHcMm(scale2(hcMm));
        r.setAcMm(scale2(acMm));
        r.setFlMm(scale2(flMm));
        r.setEfwG(efwG);
        r.setNote(note != null && !note.isBlank() ? note.trim() : null);
        fetalUltrasoundRecordMapper.insert(r);
        log.info("[健康] B超记录已插入 recordId={} gestationWeek={} bpd={} hc={} ac={} fl={} efw={}",
                r.getId(), r.getGestationWeek(), r.getBpdMm(), r.getHcMm(), r.getAcMm(), r.getFlMm(), r.getEfwG());
        var analysis = healthAnalysisService.analyzeFetalSync(userId, r, 10);
        if (analysis != null) {
            log.info("[健康] B超同步分析完成 recordId={} analysisId={}", r.getId(), analysis.getId());
        } else {
            log.info("[健康] B超分析已转为异步 recordId={}", r.getId());
        }
        return Result.success(r);
    }

    @GetMapping("/fetalRecords")
    public Result<List<Map<String, Object>>> listFetalRecords(@RequestParam("userId") Integer userId) {
        List<FetalUltrasoundRecord> records = fetalUltrasoundRecordMapper.listByUserId(userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (FetalUltrasoundRecord r : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("record", r);
            if (r.getGestationWeek() != null) {
                FetalReference.FetalRef ref = FetalReference.byWeek(r.getGestationWeek());
                if (ref != null) {
                    item.put("reference", ref.toMapWithRange());
                    item.put("status", FetalReference.status(r, ref));
                    item.put("advice", FetalReference.advice(FetalReference.status(r, ref)));
                }
            }
            out.add(item);
        }
        return Result.success(out);
    }

    @GetMapping("/summary")
    public Result<Map<String, Object>> summary(@RequestParam("userId") Integer userId) {
        log.info("[健康] summary 请求 userId={}", userId);
        Map<String, Object> res = new LinkedHashMap<>();
        PregnancyWeightRecord latestWeight = pregnancyWeightRecordMapper.latestByUserId(userId);
        FetalUltrasoundRecord latestFetal = fetalUltrasoundRecordMapper.latestByUserId(userId);
        res.put("latestWeight", latestWeight);
        res.put("latestFetal", latestFetal);
        Integer week = null;
        if (latestWeight != null) week = latestWeight.getGestationWeek();
        if (week == null && latestFetal != null) week = latestFetal.getGestationWeek();
        if (week == null) week = resolveGestationWeek(userId, LocalDate.now(), null);
        res.put("gestationWeek", week);
        log.info("[健康] summary 返回 gestationWeek={}", week);
        res.put("communityEnabled", Boolean.TRUE.equals(userService.getCommunityEnabled(userId)));
        res.put("emailEnabled", Boolean.TRUE.equals(userService.getEmailEnabled(userId)));
        return Result.success(res);
    }

    @GetMapping("/reference")
    public Result<Map<String, Object>> reference(@RequestParam("gestationWeek") Integer gestationWeek) {
        if (gestationWeek == null) return Result.error(400, "BAD_REQUEST", "请提供孕周");
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("gestationWeek", gestationWeek);
        BigDecimal suggested = WeightReference.suggestedGainKg(gestationWeek);
        BigDecimal[] range = WeightReference.rangeForSuggested(suggested);
        res.put("weight", Map.of(
                "suggestedGainKg", suggested,
                "range", Map.of("min", range[0], "max", range[1])
        ));
        FetalReference.FetalRef ref = FetalReference.byWeek(gestationWeek);
        res.put("fetal", ref == null ? null : ref.toMapWithRange());
        return Result.success(res);
    }

    @GetMapping("/analysisHistory")
    public Result<List<com.anmory.yunji.entity.HealthAnalysisRecord>> analysisHistory(
            @RequestParam("userId") Integer userId,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        if (limit <= 0 || limit > 100) limit = 20;
        return Result.success(healthAnalysisService.listAnalysisHistory(userId, limit));
    }

    @GetMapping("/analysisByRecord")
    public Result<com.anmory.yunji.entity.HealthAnalysisRecord> analysisByRecord(
            @RequestParam("userId") Integer userId,
            @RequestParam("recordType") String recordType,
            @RequestParam("recordId") Long recordId) {
        log.info("[健康] analysisByRecord 请求 userId={} recordType={} recordId={}", userId, recordType, recordId);
        var result = healthAnalysisService.getAnalysisByRecord(userId, recordType, recordId);
        log.info("[健康] analysisByRecord 结果 recordId={} 有分析={}", recordId, result != null);
        return Result.success(result);
    }

    private Integer resolveGestationWeek(Integer userId, LocalDate recordDate, Integer suppliedWeek) {
        if (suppliedWeek != null && suppliedWeek > 0 && suppliedWeek <= 45) return suppliedWeek;
        User user = userService.getById(userId);
        if (user == null) return null;
        if (user.getLastMenstrualDate() != null) {
            long days = ChronoUnit.DAYS.between(user.getLastMenstrualDate(), recordDate);
            if (days < 0) return null;
            return (int) (days / 7) + 1;
        }
        if (user.getPregnancyTime() != null) {
            long daysToDue = ChronoUnit.DAYS.between(recordDate, user.getPregnancyTime().toLocalDate());
            int week = 40 - (int) Math.floor(daysToDue / 7.0);
            if (week < 1 || week > 45) return null;
            return week;
        }
        return null;
    }

    private static BigDecimal scale2(BigDecimal v) {
        if (v == null) return null;
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
