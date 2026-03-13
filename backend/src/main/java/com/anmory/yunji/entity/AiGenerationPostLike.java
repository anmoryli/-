package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiGenerationPostLike {
    private Integer likeId;
    private Integer postId;
    private Integer userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

