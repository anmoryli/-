package com.anmory.yunji.service;

/**
 * 向量库嵌入任务服务
 * 统一管理多源异构数据的嵌入与删除，替代直接调用 ragService.embedAsync
 */
public interface EmbedTaskService {

    /**
     * 提交嵌入任务（新增/编辑记录时调用）
     * 若同一 source+source_id 已有 pending 任务，则更新文本快照
     */
    void submitUpsert(int userId, String text, String source, String sourceId);

    /**
     * 提交删除任务（删除记录时调用）
     */
    void submitDelete(int userId, String source, String sourceId);

    /**
     * AI 丰富化完成后激活任务（将 waiting_enrich 转为 pending，用最新内容更新快照）
     */
    void activateTask(String source, String sourceId, String text);
}
