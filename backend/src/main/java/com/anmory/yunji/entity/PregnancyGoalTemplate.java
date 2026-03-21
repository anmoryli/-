package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 孕期目标模板实体
 */
@Data
public class PregnancyGoalTemplate {
    private Integer templateId;
    private String category;
    private String trackKey;
    private String name;
    private String description;
    private Integer targetValue = 1;
    private String unit;
    private Integer points = 0;
    private Integer sortOrder = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
