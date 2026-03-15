package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.TextMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.MemoAiEnrichmentService;
import com.anmory.yunji.service.PromptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoAiEnrichmentServiceImpl implements MemoAiEnrichmentService {

    private final TextMapper textMapper;
    private final MemoMapper memoMapper;
    private final ChatClient chatClient;
    private final PromptService promptService;
    private final FamilyService familyService;

    private static final String PLACEHOLDER_TITLE = "记录";

    @Override
    @Async
    public void enrichTextAsync(Integer memoId, String content) {
        if (memoId == null || content == null) return;
        try {
            Text text = textMapper.selectByMemoId(memoId);
            if (text == null) return;

            boolean needsTitle = isPlaceholderTitle(text.getTitle(), content);
            boolean needsCategory = true;
            Memo memo = memoMapper.selectByIdCompat(memoId);
            if (memo != null && memo.getCategory() != null && !memo.getCategory().isBlank()) {
                needsCategory = false;
            }

            if (needsTitle) {
                Integer recordOwnerId = memo != null ? memo.getUserId() : null;
                String title = generateTitle(content, recordOwnerId);
                if (title != null && !title.isBlank()) {
                    text.setTitle(title);
                    textMapper.updateById(text);
                    log.info("AI 标题已更新 memoId={} title={}", memoId, title);
                }
            }

            if (needsCategory && memo != null) {
                String category = generateCategory(content, memo.getUserId());
                if (category != null && !category.isBlank()) {
                    memoMapper.updateCategory(memoId, category);
                    log.info("AI 分类已更新 memoId={} category={}", memoId, category);
                }
            }

            if (memo != null && (memo.getMood() == null || memo.getMood().isBlank())) {
                String mood = inferMoodFromContent(content);
                if (mood != null && !mood.isBlank()) {
                    memoMapper.updateMood(memoId, mood);
                    log.info("AI 情绪已更新 memoId={} mood={}", memoId, mood);
                }
            }
        } catch (Exception e) {
            log.warn("AI 增强失败 memoId={}", memoId, e);
        }
    }

    private boolean isPlaceholderTitle(String title, String content) {
        if (title == null || title.isBlank()) return true;
        if (PLACEHOLDER_TITLE.equals(title)) return true;
        String truncated = content.length() > 20 ? content.substring(0, 20) + "…" : content;
        return truncated.equals(title) || (content.length() > 20 && title.startsWith(content.substring(0, Math.min(20, content.length()))));
    }

    private boolean isSpouseUser(Integer userId) {
        if (userId == null) return false;
        Family f = familyService.getMyFamily(userId);
        if (f == null || f.getCreatorUserId() == null) return false;
        List<Integer> spouseIds = familyService.getSpouseUserIds(f.getCreatorUserId());
        return spouseIds != null && spouseIds.contains(userId);
    }

    private String generateTitle(String content, Integer recordOwnerUserId) {
        try {
            String key = (recordOwnerUserId != null && isSpouseUser(recordOwnerUserId)) ? "memo_text_title_dad" : "memo_text_title";
            String promptStr = promptService.getUserPrompt(key, "default", Map.of("content", content));
            if (promptStr == null || promptStr.isBlank()) {
                promptStr = "请为以下孕期记录生成一个简洁的标题（不超过20字）：" + content;
            }
            String result = chatClient.prompt().user(promptStr).call().content();
            return result != null ? result.trim() : null;
        } catch (Exception e) {
            log.warn("生成标题失败", e);
            return null;
        }
    }

    private static final String DEFAULT_CATEGORY = "日记";
    private static final String[] FORBIDDEN_CATEGORY_PHRASES = {"信息不足", "无法分类", "无法判断"};

    private String generateCategory(String content, Integer recordOwnerUserId) {
        try {
            String key = (recordOwnerUserId != null && isSpouseUser(recordOwnerUserId)) ? "memo_category_tag_dad" : "memo_category_tag";
            String promptStr = promptService.getUserPrompt(key, "default", Map.of("content", content));
            if (promptStr == null || promptStr.isBlank()) return DEFAULT_CATEGORY;
            String result = chatClient.prompt().user(promptStr).call().content();
            return normalizeCategory(result);
        } catch (Exception e) {
            log.warn("生成分类失败", e);
            return DEFAULT_CATEGORY;
        }
    }

    /** 禁止返回「信息不足」「无法分类」等，必须返回至少一个有效标签 */
    private String normalizeCategory(String raw) {
        if (raw == null || raw.isBlank()) return DEFAULT_CATEGORY;
        String t = raw.trim();
        for (String phrase : FORBIDDEN_CATEGORY_PHRASES) {
            if (t.contains(phrase)) return DEFAULT_CATEGORY;
        }
        return t;
    }

    private static final Set<String> VALID_MOODS = Set.of("happy", "calm", "tired", "anxious", "peaceful");

    /** 根据记录内容推断心情枚举，写回 memo.mood */
    private String inferMoodFromContent(String content) {
        if (content == null || content.isBlank()) return null;
        try {
            String promptStr = promptService.getUserPrompt("memo_emotion_from_content", "default", Map.of("content", content.length() > 500 ? content.substring(0, 500) : content));
            if (promptStr == null || promptStr.isBlank()) return null;
            String result = chatClient.prompt().user(promptStr).call().content();
            if (result == null) return null;
            String trimmed = result.trim().toLowerCase().replaceAll("[^a-z]", "");
            return VALID_MOODS.contains(trimmed) ? trimmed : null;
        } catch (Exception e) {
            log.warn("AI 情绪识别失败", e);
            return null;
        }
    }
}
