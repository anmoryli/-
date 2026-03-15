package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Conversation;
import com.anmory.yunji.mapper.ConversationMapper;
import com.anmory.yunji.service.ConversationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationMapper conversationMapper;

    public ConversationServiceImpl(ConversationMapper conversationMapper) {
        this.conversationMapper = conversationMapper;
    }

    @Override
    public Conversation create(Integer userId, String title) {
        Conversation c = new Conversation();
        c.setUserId(userId);
        c.setMemoId(null);
        c.setTitle(title != null && !title.isBlank() ? title.trim() : "新对话");
        conversationMapper.insert(c);
        return c;
    }

    @Override
    public List<Conversation> listByUserId(Integer userId) {
        return conversationMapper.selectByUserId(userId);
    }

    @Override
    public Conversation getById(Integer conversationId) {
        return conversationMapper.selectById(conversationId);
    }

    @Override
    public Conversation getByIdAndUserId(Integer conversationId, Integer userId) {
        return conversationMapper.selectByIdAndUserId(conversationId, userId);
    }

    @Override
    public boolean delete(Integer userId, Integer conversationId) {
        return conversationMapper.deleteByIdAndUserId(conversationId, userId) > 0;
    }

    @Override
    public void markRead(Integer userId, Integer conversationId) {
        Conversation c = conversationMapper.selectByIdAndUserId(conversationId, userId);
        if (c != null) {
            conversationMapper.updateHasUnreadAi(conversationId, false);
        }
    }

    @Override
    public void setUnreadAi(Integer conversationId) {
        conversationMapper.updateHasUnreadAi(conversationId, true);
    }

    @Override
    public boolean hasAnyUnreadAi(Integer userId) {
        List<Conversation> list = conversationMapper.selectByUserId(userId);
        return list != null && list.stream().anyMatch(c -> Boolean.TRUE.equals(c.getHasUnreadAi()));
    }
}
