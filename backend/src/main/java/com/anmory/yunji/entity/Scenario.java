package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 情景演绎 - 情景模板（内置）
 */
@Data
public class Scenario {
    private Integer scenarioId;
    private String title;
    private String description;
    private Integer sortOrder;
    private String openingPromptKey;
    private String endTriggerHint;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
