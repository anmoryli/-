package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiGenerationPost {
    private Integer postId;
    private Integer userId;
    private Integer templateId;
    private String inputImageUrl;
    /** 多张参考图 URL 数组的 JSON 字符串，兼容 inputImageUrl 为首图 */
    private String inputImageUrls;
    private String outputImageUrl;
    private String promptText;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

