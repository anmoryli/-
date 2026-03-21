package com.anmory.yunji.service.impl;

import com.anmory.yunji.common.RagService;
import com.anmory.yunji.entity.Conversation;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.FamilyMapper;
import com.anmory.yunji.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * 主动破冰：随机概率触发，RAG 检索近期记录，按 prompt 生成消息写入会话，站内通知；双方模式时邮件提醒。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProactiveIceBreakServiceImpl implements ProactiveIceBreakService {

    private final FamilyMapper familyMapper;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final EmotionPregnancyService emotionPregnancyService;
    private final UserService userService;
    private final PromptService promptService;
    private final OpenAiChatModel openAiChatModel;
    private final RagService ragService;
    private final FamilyService familyService;
    private final UserNotificationService userNotificationService;
    private final MailService mailService;

    private static final Random RANDOM = new Random();

    @Override
    public void createIceBreakConversations() {
        List<Family> families;
        try {
            families = familyMapper.selectAll();
        } catch (Exception e) {
            log.warn("[破冰] 查询家庭列表失败: {}", e.getMessage());
            return;
        }
        if (families == null || families.isEmpty()) return;

        for (Family family : families) {
            if (family.getCreatorUserId() == null) continue;
            Integer creatorUserId = family.getCreatorUserId();
            List<Integer> spouseIds = familyService.getSpouseUserIds(creatorUserId);
            if (spouseIds == null) spouseIds = List.of();

            int mode = RANDOM.nextInt(3);
            if (spouseIds.isEmpty() && mode != 0) mode = 0;

            try {
                if (mode == 0) {
                    sendToMom(creatorUserId);
                } else if (mode == 1) {
                    sendToDad(creatorUserId, spouseIds.get(0));
                } else {
                    sendToCouple(creatorUserId, spouseIds);
                }
            } catch (Exception e) {
                log.warn("[破冰] 家庭 creatorUserId={} 处理失败", creatorUserId, e);
            }
        }
    }

    private int getCurrentWeek(Integer creatorUserId) {
        User user = userService.getById(creatorUserId);
        if (user == null) return 20;
        LocalDate lmd = user.getLastMenstrualDate();
        if (lmd == null && user.getPregnancyTime() != null) {
            try {
                lmd = user.getPregnancyTime().toLocalDate().minusDays(280);
            } catch (Exception ignored) {}
        }
        if (lmd == null) return 20;
        return Math.max(0, Math.min(com.anmory.yunji.utils.PregnancyWeekUtil.MAX_PREGNANCY_WEEK, com.anmory.yunji.utils.PregnancyWeekUtil.getWeekIndex(lmd, LocalDate.now())));
    }

    private String buildRecentSummary(Integer creatorUserId) {
        try {
            String rag = ragService.getRelevant("最近一周记录 心情 体重 日记", creatorUserId, true, 5);
            if (rag != null && !rag.isBlank() && !rag.contains("暂时不可用") && !rag.contains("异常")) {
                return rag.length() > 500 ? rag.substring(0, 500) : rag;
            }
        } catch (Exception e) {
            log.debug("[破冰] RAG 检索失败，使用上周摘要", e);
        }
        String lastWeek = emotionPregnancyService.getLastWeekSummary(creatorUserId);
        return lastWeek != null ? lastWeek : "暂无近期记录";
    }

    private String generateIceBreakMessage(String promptKey, String recentSummary, int week) {
        String userPrompt = promptService.getUserPrompt(promptKey, "default",
                Map.of("recentSummary", recentSummary, "week", String.valueOf(week)));
        String systemPrompt = promptService.getSystemPrompt(promptKey, "default");
        if (userPrompt == null || userPrompt.isBlank()) {
            userPrompt = "近期记录摘要：" + recentSummary + "。当前孕周：" + week + "。请写一句主动破冰的暖心话（30～80字），只输出这一句。";
        }
        var builder = ChatClient.builder(openAiChatModel).build().prompt();
        if (systemPrompt != null && !systemPrompt.isBlank()) builder = builder.system(systemPrompt);
        String result = builder.user(userPrompt).call().content();
        if (result != null) result = result.replaceAll("[\\r\\n]+", " ").trim();
        return (result != null && !result.isBlank()) ? result : "今天感觉怎么样？有什么想记录的吗～";
    }

    private void sendToMom(Integer creatorUserId) {
        int week = getCurrentWeek(creatorUserId);
        String recentSummary = buildRecentSummary(creatorUserId);
        String content = generateIceBreakMessage("proactive_icebreak_mom", recentSummary, week);
        Conversation c = conversationService.create(creatorUserId, "想和你聊聊～");
        messageService.save(c.getConversationId(), creatorUserId, content, true, false);
        conversationService.setUnreadAi(c.getConversationId());
        userNotificationService.notifySystem(creatorUserId, "孕期小伴给你发了一条消息", content.length() > 50 ? content.substring(0, 50) + "…" : content);
        log.info("[破冰] 已向孕妇 {} 发送破冰消息", creatorUserId);
    }

    private void sendToDad(Integer creatorUserId, Integer spouseUserId) {
        int week = getCurrentWeek(creatorUserId);
        String recentSummary = buildRecentSummary(creatorUserId);
        String content = generateIceBreakMessage("proactive_icebreak_dad", recentSummary, week);
        Conversation c = conversationService.create(spouseUserId, "想和你聊聊～");
        messageService.save(c.getConversationId(), spouseUserId, content, true, false);
        conversationService.setUnreadAi(c.getConversationId());
        userNotificationService.notifySystem(spouseUserId, "孕期小伴给你发了一条消息", content.length() > 50 ? content.substring(0, 50) + "…" : content);
        log.info("[破冰] 已向配偶 {} 发送破冰消息", spouseUserId);
    }

    private void sendToCouple(Integer creatorUserId, List<Integer> spouseIds) {
        int week = getCurrentWeek(creatorUserId);
        String content = generateIceBreakMessage("proactive_icebreak_couple", "当前孕周" + week + "周", week);
        Conversation cMom = conversationService.create(creatorUserId, "想和你聊聊～");
        messageService.save(cMom.getConversationId(), creatorUserId, content, true, false);
        conversationService.setUnreadAi(cMom.getConversationId());
        userNotificationService.notifySystem(creatorUserId, "孕期小伴给你发了一条消息", content.length() > 50 ? content.substring(0, 50) + "…" : content);
        for (Integer spouseUserId : spouseIds) {
            Conversation cDad = conversationService.create(spouseUserId, "想和你聊聊～");
            messageService.save(cDad.getConversationId(), spouseUserId, content, true, false);
            conversationService.setUnreadAi(cDad.getConversationId());
            userNotificationService.notifySystem(spouseUserId, "孕期小伴给你发了一条消息", content.length() > 50 ? content.substring(0, 50) + "…" : content);
            try {
                User u = userService.getById(spouseUserId);
                if (u != null && u.getEmail() != null && !u.getEmail().isBlank() && !Boolean.FALSE.equals(u.getEmailEnabled())) {
                    String htmlBody = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBodyWithStyle(
                        com.anmory.yunji.service.impl.MailServiceImpl.textToHtmlParagraphs("孕期小伴：" + content));
                    mailService.sendHtmlMail(u.getEmail(), "孕期小伴给你发了一条消息", htmlBody);
                }
            } catch (Exception e) {
                log.debug("[破冰] 配偶邮件发送失败 spouseUserId={}", spouseUserId, e);
            }
        }
        try {
            User mom = userService.getById(creatorUserId);
            if (mom != null && mom.getEmail() != null && !mom.getEmail().isBlank() && !Boolean.FALSE.equals(mom.getEmailEnabled())) {
                String htmlBody = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBodyWithStyle(
                        com.anmory.yunji.service.impl.MailServiceImpl.textToHtmlParagraphs("孕期小伴：" + content));
                    mailService.sendHtmlMail(mom.getEmail(), "孕期小伴给你发了一条消息", htmlBody);
            }
        } catch (Exception e) {
            log.debug("[破冰] 孕妇邮件发送失败 creatorUserId={}", creatorUserId, e);
        }
        log.info("[破冰] 已向孕妇 {} 及配偶发送破冰消息并邮件提醒", creatorUserId);
    }
}
