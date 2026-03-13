package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户成就实体
 */
@Data
public class UserAchievement {
    private Integer achievementId;
    private Integer userId;
    private String badgeKey;
    private String badgeName;
    private LocalDateTime earnedAt;
}
