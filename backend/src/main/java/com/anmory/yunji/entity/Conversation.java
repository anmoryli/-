package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 对话实体类
 * 对应数据库中的conversation表，存储AI对话的会话基础信息
 */
@Data
public class Conversation {
    /**
     * 对话ID，主键，自增，非空
     */
    private Integer conversationId;

    /**
     * 用户ID，关联用户表，非空
     */
    private Integer userId;

    /**
     * 关联的备忘录ID，纯AI对话可为空
     */
    private Integer memoId;

    /**
     * 情景演绎时关联 scenario 表
     */
    private Integer scenarioId;

    /**
     * 对话标题，非空
     */
    private String title;

    /**
     * 创建时间，默认当前时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间，默认当前时间，更新时自动刷新
     */
    private LocalDateTime updatedAt;

    /**
     * 是否有用户未读的 AI 消息（破冰或 AI 回复时置 true，拉取历史或标记已读时置 false）
     */
    private Boolean hasUnreadAi;
}