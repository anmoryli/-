package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 向量库嵌入任务实体
 * 作为 MySQL 与 Milvus 之间的数据桥梁，支持可追溯、可重试、可审计
 */
@Data
public class EmbedTask {
    private Long id;
    private Integer userId;
    private String source;
    private String sourceId;
    private String action;
    private String textSnapshot;
    private String status;
    private Integer retryCount;
    private Integer maxRetry;
    private String errorMsg;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
