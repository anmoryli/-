package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 情景演绎报告（仅配偶可见）
 */
@Data
public class ScenarioReport {
    private Integer reportId;
    private Integer conversationId;
    private Integer scenarioId;
    private Integer spouseUserId;
    private Integer creatorUserId;
    private String content;
    private LocalDateTime createdAt;

    /** 列表查询时 JOIN scenario 得到的标题，非表字段 */
    private String scenarioTitle;
}
