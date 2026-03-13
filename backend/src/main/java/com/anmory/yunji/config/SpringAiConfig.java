package com.anmory.yunji.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring AI 1.1.2 版本 ChatClient 配置
 */
@Configuration
public class SpringAiConfig {

    /**
     * 自动注入 OpenAiChatModel（由 starter 自动配置，无需手动传API Key）
     * 前提：application.yml 中 spring.ai.openai 配置正确
     */
    @Bean
    public ChatClient chatClient(OpenAiChatModel openAiChatModel) {
        // Spring AI 1.1.x 核心构建方式：ChatClient.create(chatModel)
        return ChatClient.create(openAiChatModel);
    }
}