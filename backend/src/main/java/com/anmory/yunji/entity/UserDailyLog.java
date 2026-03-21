package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户每日日志（胎动 + 心情）
 */
@Data
public class UserDailyLog {
    private Integer logId;
    private Integer userId;
    private LocalDate recordDate;
    private Integer kickCount = 0;
    private String mood;
    private Double weightKg;
    /** 健康值 0-100 */
    private Integer healthValue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
