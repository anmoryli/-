package com.anmory.yunji.service;

import com.anmory.yunji.entity.FetalUltrasoundRecord;
import com.anmory.yunji.entity.HealthAnalysisRecord;
import com.anmory.yunji.entity.PregnancyWeightRecord;

import java.util.List;

/**
 * 健康分析服务：根据体重/B超记录调用 AI 生成建议并保存
 */
public interface HealthAnalysisService {

    /**
     * 分析体重记录并保存 AI 建议
     */
    void analyzeAndSaveWeight(Integer userId, PregnancyWeightRecord record);

    /**
     * 分析 B 超记录并保存 AI 建议
     */
    void analyzeAndSaveFetal(Integer userId, FetalUltrasoundRecord record);

    /**
     * 获取用户最近 AI 分析记录
     */
    List<HealthAnalysisRecord> listAnalysisHistory(Integer userId, int limit);

    /**
     * 按记录查询分析结果（用于单条记录的「查看建议」）
     */
    HealthAnalysisRecord getAnalysisByRecord(Integer userId, String recordType, Long recordId);

    /**
     * 同步分析 B 超记录（阻塞等待，超时返回 null）
     */
    HealthAnalysisRecord analyzeFetalSync(Integer userId, FetalUltrasoundRecord record, int timeoutSeconds);
}
