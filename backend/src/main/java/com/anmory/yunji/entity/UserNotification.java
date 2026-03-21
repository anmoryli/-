package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserNotification {
    private Integer id;
    private Integer userId;
    private String type;
    private String title;
    private String body;
    private Integer relatedTaskId;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
