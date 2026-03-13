package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiGenerationPostCommentLike {
    private Integer likeId;
    private Integer commentId;
    private Integer userId;
    private LocalDateTime createdAt;
}
