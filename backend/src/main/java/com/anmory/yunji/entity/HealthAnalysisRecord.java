package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HealthAnalysisRecord {
    private Long id;
    private Integer userId;
    private String recordType;
    private Long recordId;
    private Integer gestationWeek;
    private String analysisText;
    private LocalDateTime createdAt;
}
