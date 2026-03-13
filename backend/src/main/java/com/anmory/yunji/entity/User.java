package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * 对应数据库中的user表，存储用户基础信息
 */
@Data
public class User {
    /**
     * 用户ID，主键，自增
     */
    private Integer userId;

    /**
     * 用户名，非空
     */
    private String username;

    /**
     * 加密后的密码，非空
     */
    private String passwordHash;

    /**
     * 头像URL，可为空
     */
    private String avatarUrl;

    /**
     * 用户邮箱，可空，后续绑定，用于找回密码和接收消息
     */
    private String email;

    /**
     * 末次月经日/怀孕起算日，用于计算孕周，可空（老数据兼容）
     */
    private LocalDate lastMenstrualDate;

    /**
     * 预产期，非空
     */
    private LocalDateTime pregnancyTime;

    /**
     * 创建时间，默认当前时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间，默认当前时间，更新时自动刷新
     */
    private LocalDateTime updatedAt;

    /**
     * 家人共享时的分享范围：all|letters|photos
     */
    private String shareScope = "all";

    /**
     * 用户角色：pregnant 孕妇本人，family_member 家庭成员
     */
    private String userType = "pregnant";

    /**
     * 是否允许收集匿名使用数据以改进服务，默认 false
     */
    private Boolean dataCollectionEnabled;

    /**
     * 注册时选择的默认关系（家庭成员时：配偶、婆婆、妈妈、爸爸等），加入家庭时自动沿用
     */
    private String defaultRelationship;

    /**
     * 是否为某家庭的配偶（用于前端判断是否开放 AI 对话等），非持久化，由接口层填充
     */
    private Boolean isSpouse;
}