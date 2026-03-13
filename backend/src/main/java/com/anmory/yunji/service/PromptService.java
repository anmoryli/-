package com.anmory.yunji.service;

import java.util.Map;

/**
 * 提示词管理服务：按 key 与 model 返回提示词，优先从 DB 读取，fallback 到 JSON。
 */
public interface PromptService {

    /**
     * 获取系统提示词（无占位符）
     *
     * @param key       提示词 key
     * @param modelType 模型类型，默认 "default"
     * @return 系统提示词，若不存在返回 null
     */
    String getSystemPrompt(String key, String modelType);

    /**
     * 获取系统提示词，使用默认 modelType
     */
    default String getSystemPrompt(String key) {
        return getSystemPrompt(key, "default");
    }

    /**
     * 获取用户提示词模板并替换占位符
     *
     * @param key       提示词 key
     * @param modelType 模型类型
     * @param params    占位符 Map，如 {"content":"xxx","week":"12"}
     * @return 替换后的用户提示词
     */
    String getUserPrompt(String key, String modelType, Map<String, String> params);

    /**
     * 获取用户提示词，使用默认 modelType
     */
    default String getUserPrompt(String key, Map<String, String> params) {
        return getUserPrompt(key, "default", params);
    }
}
