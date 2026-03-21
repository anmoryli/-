package com.anmory.yunji.service.impl;

import com.anmory.yunji.dto.EmotionPregnancySummaryDto;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.service.EmotionPregnancyDailyHintService;
import com.anmory.yunji.service.EmotionPregnancyService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Map;

/**
 * 情绪孕周每日一句：基于近期摘要 + 孕周生成 ≤30 字提示，存 Redis 24h TTL，0 点由定时任务刷新。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionPregnancyDailyHintServiceImpl implements EmotionPregnancyDailyHintService {

    private static final String REDIS_KEY_PREFIX = "emotion_pregnancy_daily:";
    private static final Duration TTL = Duration.ofHours(24);
    private static final int MAX_HINT_LEN = 30;

    private final StringRedisTemplate stringRedisTemplate;
    private final EmotionPregnancyService emotionPregnancyService;
    private final UserService userService;
    private final PromptService promptService;
    private final OpenAiChatModel openAiChatModel;

    @Override
    public String getDailyHint(Integer userId) {
        if (userId == null) return null;
        String key = REDIS_KEY_PREFIX + userId;
        try {
            String value = stringRedisTemplate.opsForValue().get(key);
            return (value != null && !value.isBlank()) ? value.trim() : null;
        } catch (Exception e) {
            log.debug("getDailyHint Redis read failed userId={}", userId, e);
            return null;
        }
    }

    @Override
    public void computeAndStore(Integer userId) {
        if (userId == null) return;
        User user = userService.getById(userId);
        if (user == null) return;
        LocalDate lmd = user.getLastMenstrualDate();
        if (lmd == null && user.getPregnancyTime() != null) {
            try {
                lmd = user.getPregnancyTime().toLocalDate().minusDays(280);
            } catch (Exception ignored) {}
        }
        int week = 0;
        if (lmd != null) {
            week = PregnancyWeekUtil.getWeekIndex(lmd, LocalDate.now());
        }
        if (week < 0) week = 0;
        if (week > 52) week = 52;

        String recentSummary;
        try {
            recentSummary = emotionPregnancyService.getLastWeekSummary(userId);
            EmotionPregnancySummaryDto summary = emotionPregnancyService.getSummary(userId);
            if (summary != null && summary.getWarmSentence() != null && !summary.getWarmSentence().isBlank()) {
                recentSummary = recentSummary + "；" + summary.getWarmSentence();
            }
        } catch (Exception e) {
            log.debug("getLastWeekSummary/getSummary failed userId={}", userId, e);
            recentSummary = "暂无近期记录";
        }
        if (recentSummary == null) recentSummary = "暂无近期记录";

        String userPrompt = promptService.getUserPrompt("emotion_pregnancy_daily_hint", "default",
                Map.of("recentSummary", recentSummary, "week", String.valueOf(week)));
        String systemPrompt = promptService.getSystemPrompt("emotion_pregnancy_daily_hint", "default");
        if (userPrompt == null || userPrompt.isBlank()) {
            userPrompt = "近期摘要：" + recentSummary + "。当前孕周：" + week + "周。请生成一句情绪相关的温暖提示（严格不超过30字），直接输出内容。";
        }
        String result;
        try {
            var builder = ChatClient.builder(openAiChatModel).build().prompt();
            if (systemPrompt != null && !systemPrompt.isBlank()) builder = builder.system(systemPrompt);
            result = builder.user(userPrompt).call().content();
        } catch (Exception e) {
            log.warn("emotion_pregnancy_daily_hint AI call failed userId={}", userId, e);
            return;
        }
        if (result != null) {
            result = result.replaceAll("[\\r\\n]+", " ").trim();
            if (result.length() > MAX_HINT_LEN) result = result.substring(0, MAX_HINT_LEN);
        }
        if (result == null || result.isBlank()) return;

        String key = REDIS_KEY_PREFIX + userId;
        try {
            stringRedisTemplate.opsForValue().set(key, result, TTL);
            log.debug("emotion_pregnancy_daily hint stored userId={}", userId);
        } catch (Exception e) {
            log.warn("emotion_pregnancy_daily Redis write failed userId={}", userId, e);
        }
    }
}
