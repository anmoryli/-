package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScheduledOperation {
    private Integer id;
    private Integer userId;
    private String content;
    private String scheduleType;
    private LocalDateTime runAt;
    private String runTime;
    private LocalDateTime nextRunAt;
    private String status;
    private LocalDateTime createdAt;
}
