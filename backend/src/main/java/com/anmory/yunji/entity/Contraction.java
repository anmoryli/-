package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 宫缩记录
 */
@Data
public class Contraction {
    private Integer contractionId;
    private Integer userId;
    private LocalDateTime startedAt;
    private Integer durationSeconds;
    private LocalDateTime createdAt;
}
