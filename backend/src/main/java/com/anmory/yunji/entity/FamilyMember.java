package com.anmory.yunji.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 家庭成员实体
 */
@Data
public class FamilyMember {
    private Integer memberId;
    private Integer familyId;
    private Integer userId;
    private String role = "member";
    /** 与孕妇关系，如老公、婆婆、妈妈等，支持自定义 */
    private String relationship;
    /** 是否为配偶，由 LLM 异步判断 */
    private Boolean isSpouse;
    private LocalDateTime joinedAt;
}
