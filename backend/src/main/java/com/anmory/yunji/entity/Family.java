package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 家庭实体
 */
@Data
public class Family {
    private Integer familyId;
    private Integer creatorUserId;
    private String inviteCode;
    private LocalDateTime inviteExpiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
