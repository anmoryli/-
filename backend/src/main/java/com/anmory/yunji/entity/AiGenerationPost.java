package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiGenerationPost {
    private Integer postId;
    private Integer userId;
    private Integer templateId;
    private String inputImageUrl;
    private String outputImageUrl;
    private String promptText;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

