package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 记录点赞实体
 */
@Data
public class RecordLike {
    private Integer likeId;
    private Integer memoId;
    private Integer userId;
    private LocalDateTime createdAt;
}
