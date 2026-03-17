package com.anmory.yunji.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PregnancyWeightRecord {
    private Long id;
    private Integer userId;
    private LocalDate recordDate;
    private Integer gestationWeek;
    private BigDecimal weightKg;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

