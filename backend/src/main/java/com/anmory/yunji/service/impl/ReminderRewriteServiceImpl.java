package com.anmory.yunji.service.impl;

import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.ReminderRewriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderRewriteServiceImpl implements ReminderRewriteService {

    private final OpenAiChatModel openAiChatModel;
    private final PromptService promptService;

    @Override
    public String rewriteForSend(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) return rawContent;
        try {
            String userPrompt = promptService.getUserPrompt("reminder_send_rewrite", "default", Map.of("rawContent", rawContent));
            if (userPrompt == null || userPrompt.isBlank()) userPrompt = "用户设定的提醒原始内容：" + rawContent + "\n\n请生成一句简短、带入当前场景的提醒文案：";
            String systemPrompt = promptService.getSystemPrompt("reminder_send_rewrite", "default");
            if (systemPrompt == null || systemPrompt.isBlank()) systemPrompt = "你是提醒文案整理助手。当前已到提醒时间，请把用户设定的内容改写成一句简短、带入当前时刻的提醒（如：准备出发去xxx吧）。只输出这一句，不要解释、不要换行。";
            String out = ChatClient.builder(openAiChatModel)
                    .defaultSystem(systemPrompt)
                    .build()
                    .prompt()
                    .user(userPrompt)
                    .call()
                    .content();
            if (out != null && !out.isBlank()) {
                return out.trim().replaceAll("^[\"']|[\"']$", "").replaceAll("\\n+", " ").trim();
            }
        } catch (Exception e) {
            log.warn("提醒文案改写失败，使用原文 rawContent={}", rawContent, e);
        }
        return rawContent;
    }
}
