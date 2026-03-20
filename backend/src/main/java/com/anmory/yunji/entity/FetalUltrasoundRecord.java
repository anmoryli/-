package com.anmory.yunji.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FetalUltrasoundRecord {
    private Long id;
    private Integer userId;
    private LocalDate recordDate;
    private Integer gestationWeek;
    private BigDecimal bpdMm;
    private BigDecimal hcMm;
    private BigDecimal acMm;
    private BigDecimal flMm;
    private Integer efwG;
    private String note;
    private String fileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

