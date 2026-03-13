package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiTemplate {
    private Integer templateId;
    private Integer userId;
    private String title;
    private String promptText;
    private String category;
    private String coverImageUrl;
    private Boolean isPublic;
    private Integer usageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

