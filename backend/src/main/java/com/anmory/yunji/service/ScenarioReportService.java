package com.anmory.yunji.service;

import com.anmory.yunji.entity.ScenarioReport;

import java.util.List;

/**
 * 情景演绎报告（仅配偶可见）
 */
public interface ScenarioReportService {

    ScenarioReport create(Integer conversationId, Integer scenarioId, Integer spouseUserId, Integer creatorUserId, String content);

    /**
     * 结束情景对话并生成报告。校验会话属于当前用户且为情景会话，拉取对话历史后调用 AI 生成报告并入库。
     * @return 生成的报告，失败返回 null
     */
    ScenarioReport endAndGenerateReport(Integer userId, Integer conversationId, String reason);

    List<ScenarioReport> listBySpouseUserId(Integer spouseUserId);

    ScenarioReport getByIdAndSpouse(Integer reportId, Integer spouseUserId);
}
