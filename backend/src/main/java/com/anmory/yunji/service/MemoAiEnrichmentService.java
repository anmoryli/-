package com.anmory.yunji.service;

/**
 * 记录 AI 增强服务：异步生成标题、分类等，保存成功后后台更新
 */
public interface MemoAiEnrichmentService {

    /**
     * 异步为文字记录生成标题和分类，并更新数据库
     *
     * @param memoId 备忘录 ID
     * @param content 记录内容（用于生成标题和分类）
     */
    void enrichTextAsync(Integer memoId, String content);
}
