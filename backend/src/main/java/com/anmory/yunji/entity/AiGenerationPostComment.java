package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiGenerationPostComment {
    private Integer commentId;
    private Integer postId;
    private Integer parentCommentId;
    private Integer userId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

