package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户目标进度实体
 */
@Data
public class UserGoalProgress {
    private Integer progressId;
    private Integer userId;
    private Integer templateId;
    private Integer currentValue = 0;
    private String status = "active";
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
