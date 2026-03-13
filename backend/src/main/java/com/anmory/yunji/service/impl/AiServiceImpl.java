package com.anmory.yunji.service.impl;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.service.AiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiServiceImpl implements AiService {
    private final OpenAiChatModel openAiChatModel;

    public AiServiceImpl(OpenAiChatModel openAiChatModel) {
        this.openAiChatModel = openAiChatModel;
    }

    @Override
    public Result<String> identifyIntent(String text) {
        String systemPrompt = """
            你是意图识别助手，你必须识别用户的意图，并且只能严格返回以下的格式的纯文本：
            [图片生成],[文字对话],[视频生成],[图片理解]，
            英文的那个中括号也是生成的内容，必须严格执行
            """;

        ChatClient client = ChatClient.builder(openAiChatModel)
                .defaultSystem(systemPrompt)
                .build();

        String answer = client.prompt().user("用户问题：" + text).call().content();

        return Result.success(answer);
    }
}
