package com.anmory.yunji.service;

import com.anmory.yunji.entity.Message;

import java.util.List;

public interface MessageService {

    Integer getAiMessageCount();

    void save(Integer conversationId, Integer userId, String content, boolean isAi);

    /**
     * 保存消息；当 embedInRag 为 false 时，不将用户消息写入 RAG 向量库（用于“从向量库找东西”的检索轮次）。
     */
    void save(Integer conversationId, Integer userId, String content, boolean isAi, boolean embedInRag);

    List<Message> getHistory(Integer conversationId);
}
