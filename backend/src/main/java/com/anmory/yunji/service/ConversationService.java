package com.anmory.yunji.service;

import com.anmory.yunji.entity.Conversation;

import java.util.List;

public interface ConversationService {

    Conversation create(Integer userId, String title);

    List<Conversation> listByUserId(Integer userId);

    Conversation getById(Integer conversationId);

    Conversation getByIdAndUserId(Integer conversationId, Integer userId);

    boolean delete(Integer userId, Integer conversationId);
}
