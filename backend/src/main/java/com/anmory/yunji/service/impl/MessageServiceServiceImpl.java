package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Message;
import com.anmory.yunji.mapper.MessageMapper;
import com.anmory.yunji.service.EmbedTaskService;
import com.anmory.yunji.service.MessageService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageServiceServiceImpl implements MessageService {

    private final MessageMapper messageMapper;
    private final EmbedTaskService embedTaskService;

    public MessageServiceServiceImpl(MessageMapper messageMapper, EmbedTaskService embedTaskService) {
        this.messageMapper = messageMapper;
        this.embedTaskService = embedTaskService;
    }

    @Override
    public Integer getAiMessageCount() {
        Integer aiMessageCount = messageMapper.selectAiMessageCount();
        return aiMessageCount == null ? 0 : aiMessageCount;
    }

    @Override
    public void save(Integer conversationId, Integer userId, String content, boolean isAi) {
        save(conversationId, userId, content, isAi, true);
    }

    @Override
    public void save(Integer conversationId, Integer userId, String content, boolean isAi, boolean embedInRag) {
        Message msg = new Message();
        msg.setConversationId(conversationId);
        msg.setUserId(userId);
        msg.setContent(content);
        msg.setIsAi(isAi);
        messageMapper.insert(msg);
        if (embedInRag && !isAi && content != null && !content.isBlank() && msg.getMessageId() != null) {
            embedTaskService.submitUpsert(userId, content, "message", String.valueOf(msg.getMessageId()));
        }
    }

    @Override
    public List<Message> getHistory(Integer conversationId) {
        return messageMapper.selectByConversationId(conversationId);
    }
}
