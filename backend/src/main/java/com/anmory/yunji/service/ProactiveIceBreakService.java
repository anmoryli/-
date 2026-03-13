package com.anmory.yunji.service;

/**
 * AI 主动破冰：为长时间未互动的孕妇创建新会话
 */
public interface ProactiveIceBreakService {

    /**
     * 为「近期未聊天」的孕妇用户创建破冰会话
     */
    void createIceBreakConversations();
}
