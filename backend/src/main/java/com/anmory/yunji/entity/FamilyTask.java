package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FamilyTask {
    private Integer id;
    private Integer familyId;
    private Integer assigneeUserId;
    private String title;
    private String description;
    private String taskType;
    private Integer pregnancyWeek;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
