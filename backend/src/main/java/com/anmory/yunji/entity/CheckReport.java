package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CheckReport {
    private Integer reportId;
    private Integer userId;
    private String fileUrl;
    private String originalFilename;
    private String parsedSummary;
    private LocalDate nextCheckDate;
    private Boolean emailSent;
    private LocalDateTime lastSendAt;
    private String sendStatus;
    private Integer retryCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

