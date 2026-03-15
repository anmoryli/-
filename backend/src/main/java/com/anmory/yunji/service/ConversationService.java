package com.anmory.yunji.service;

import com.anmory.yunji.entity.Conversation;

import java.util.List;

public interface ConversationService {

    Conversation create(Integer userId, String title);

    List<Conversation> listByUserId(Integer userId);

    Conversation getById(Integer conversationId);

    Conversation getByIdAndUserId(Integer conversationId, Integer userId);

    boolean delete(Integer userId, Integer conversationId);

    /** 将会话标记为已读（清除未读 AI 红点） */
    void markRead(Integer userId, Integer conversationId);

    /** 会话有新的 AI 消息时置未读（供破冰 / 流式回复保存后调用） */
    void setUnreadAi(Integer conversationId);

    /** 当前用户是否存在任意会话有未读 AI 消息（供 Tab 红点） */
    boolean hasAnyUnreadAi(Integer userId);
}
