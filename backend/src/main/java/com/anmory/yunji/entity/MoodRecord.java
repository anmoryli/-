package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 心情记录（一天可多次）
 */
@Data
public class MoodRecord {
    private Integer id;
    private Integer userId;
    private LocalDate recordDate;
    private LocalTime recordTime;
    private String mood;
    private LocalDateTime createdAt;
}
