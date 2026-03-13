package com.anmory.yunji.service.impl;

import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.SpouseDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpouseDetectionServiceImpl implements SpouseDetectionService {

    private final FamilyMemberMapper familyMemberMapper;
    private final OpenAiChatModel openAiChatModel;
    private final PromptService promptService;

    @Override
    @Async
    public void detectSpouseAsync(Integer memberId, String relationship) {
        if (memberId == null) return;
        if (relationship == null || relationship.isBlank()) {
            familyMemberMapper.updateIsSpouse(memberId, false);
            return;
        }
        try {
            String prompt = promptService.getUserPrompt("spouse_detect", "default",
                    Map.of("relationship", relationship.trim()));
            if (prompt == null || prompt.isBlank()) {
                prompt = "请判断以下关系描述是否为孕妇的配偶（老公、丈夫、丈夫、配偶等）：\"" + relationship + "\"。仅返回 YES 或 NO。";
            }
            String raw = ChatClient.builder(openAiChatModel).build()
                    .prompt().user(prompt).call().content();
            boolean isSpouse = raw != null && raw.trim().toUpperCase().startsWith("YES");
            familyMemberMapper.updateIsSpouse(memberId, isSpouse);
            log.info("配偶判断完成 memberId={} relationship={} isSpouse={}", memberId, relationship, isSpouse);
        } catch (Exception e) {
            log.warn("配偶判断失败 memberId={} relationship={}", memberId, relationship, e);
            familyMemberMapper.updateIsSpouse(memberId, false);
        }
    }
}
