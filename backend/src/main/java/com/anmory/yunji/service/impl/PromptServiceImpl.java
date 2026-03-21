package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.PromptTemplate;
import com.anmory.yunji.mapper.PromptTemplateMapper;
import com.anmory.yunji.service.PromptService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 提示词来源（说清楚）：
 * 1. 先查数据库 prompt_template 表（按 key + model_type），有则用数据库的。
 * 2. 没有则用 resources/prompts/pregnancy.json 里同 key 的 system_prompt、user_prompt_template。
 * DB 与 JSON 条数可以不一致，以 DB 优先；未跑过的 migration 或新 key 只存在于 JSON 时，会用 JSON。
 */
@Slf4j
@Service
public class PromptServiceImpl implements PromptService {

    private static final String MODEL_DEFAULT = "default";
    private static final String PROMPTS_JSON = "prompts/pregnancy.json";

    private final PromptTemplateMapper promptTemplateMapper;
    private final ObjectMapper objectMapper;
    private Map<String, JsonNode> jsonPrompts = new HashMap<>();

    public PromptServiceImpl(PromptTemplateMapper promptTemplateMapper, ObjectMapper objectMapper) {
        this.promptTemplateMapper = promptTemplateMapper;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void loadJsonPrompts() {
        try {
            ClassPathResource resource = new ClassPathResource(PROMPTS_JSON);
            if (!resource.exists()) {
                log.warn("提示词 JSON 文件不存在: {}", PROMPTS_JSON);
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                JsonNode root = objectMapper.readTree(content);
                jsonPrompts.clear();
                root.fields().forEachRemaining(e -> jsonPrompts.put(e.getKey(), e.getValue()));
                log.info("已加载 {} 条 JSON 提示词", jsonPrompts.size());
            }
        } catch (Exception e) {
            log.warn("加载提示词 JSON 失败: {}", PROMPTS_JSON, e);
        }
    }

    @Override
    public String getSystemPrompt(String key, String modelType) {
        String mt = modelType != null && !modelType.isBlank() ? modelType : MODEL_DEFAULT;
        // 1. 尝试 DB（表可能尚未迁移）
        try {
            PromptTemplate t = promptTemplateMapper.selectByKeyAndModel(key, mt);
            if (t != null && t.getSystemPrompt() != null && !t.getSystemPrompt().isBlank()) {
                return t.getSystemPrompt();
            }
        } catch (Exception e) {
            log.debug("从 DB 读取提示词失败，使用 JSON 回退: key={}", key, e);
        }
        // 2. Fallback JSON（key 匹配即可，不区分 model）
        JsonNode node = jsonPrompts.get(key);
        if (node != null && node.has("system_prompt")) {
            JsonNode sp = node.get("system_prompt");
            if (sp != null && !sp.isNull()) {
                return sp.asText();
            }
        }
        return null;
    }

    @Override
    public String getUserPrompt(String key, String modelType, Map<String, String> params) {
        String mt = modelType != null && !modelType.isBlank() ? modelType : MODEL_DEFAULT;
        String template = null;
        // 1. 尝试 DB（表可能尚未迁移）
        try {
            PromptTemplate t = promptTemplateMapper.selectByKeyAndModel(key, mt);
            if (t != null && t.getUserPromptTemplate() != null && !t.getUserPromptTemplate().isBlank()) {
                template = t.getUserPromptTemplate();
            }
        } catch (Exception e) {
            log.debug("从 DB 读取提示词失败，使用 JSON 回退: key={}", key, e);
        }
        // 2. Fallback JSON
        if (template == null) {
            JsonNode node = jsonPrompts.get(key);
            if (node != null && node.has("user_prompt_template")) {
                JsonNode upt = node.get("user_prompt_template");
                if (upt != null && !upt.isNull()) {
                    template = upt.asText();
                }
            }
        }
        if (template == null) {
            return "";
        }
        return substitute(template, params != null ? params : Map.of());
    }

    private String substitute(String template, Map<String, String> params) {
        String result = template;
        for (Map.Entry<String, String> e : params.entrySet()) {
            String placeholder = "{" + e.getKey() + "}";
            String value = e.getValue() != null ? e.getValue() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }
}
