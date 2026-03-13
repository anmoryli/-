package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 提示词模板实体
 */
@Data
public class PromptTemplate {
    private Integer id;
    private String key;
    private String modelType;
    private String systemPrompt;
    private String userPromptTemplate;
    private LocalDateTime createdAt;
}
