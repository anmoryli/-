package com.anmory.yunji.entity;

import lombok.Data;

/**
 * 消息实体类，用于存储对话中的消息信息
 */
@Data
public class Message {
    /**
     * 消息ID，主键
     */
    private Integer messageId;

    /**
     * 对话ID，关联所属对话
     */
    private Integer conversationId;

    /**
     * 用户ID，发送消息的用户ID
     */
    private Integer userId;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 是否为AI发送的消息，true表示AI发送，false表示用户发送
     */
    private Boolean isAi;

    /**
     * 创建时间
     */
    private java.time.LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private java.time.LocalDateTime updatedAt;
}