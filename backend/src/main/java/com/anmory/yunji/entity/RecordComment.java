package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 记录评论实体
 */
@Data
public class RecordComment {
    private Integer commentId;
    private Integer memoId;
    private Integer parentCommentId;
    private Integer userId;
    private String content;
    private LocalDateTime createdAt;
}
