package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.EmbedTask;
import com.anmory.yunji.mapper.EmbedTaskMapper;
import com.anmory.yunji.service.EmbedTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbedTaskServiceImpl implements EmbedTaskService {

    private final EmbedTaskMapper embedTaskMapper;

    @Override
    public void submitUpsert(int userId, String text, String source, String sourceId) {
        if (text == null || text.isBlank()) {
            log.debug("[EmbedTask] 文本为空，跳过 source={} sourceId={}", source, sourceId);
            return;
        }
        EmbedTask existing = embedTaskMapper.selectPendingBySource(source, sourceId);
        if (existing != null) {
            embedTaskMapper.updateTextSnapshot(existing.getId(), truncate(text));
            log.debug("[EmbedTask] 更新已有任务快照 taskId={}", existing.getId());
            return;
        }
        EmbedTask task = new EmbedTask();
        task.setUserId(userId);
        task.setSource(source);
        task.setSourceId(sourceId);
        task.setAction("upsert");
        task.setTextSnapshot(truncate(text));
        task.setStatus("pending");
        task.setRetryCount(0);
        task.setMaxRetry(3);
        embedTaskMapper.insert(task);
        log.debug("[EmbedTask] 提交嵌入任务 source={} sourceId={}", source, sourceId);
    }

    @Override
    public void submitDelete(int userId, String source, String sourceId) {
        EmbedTask task = new EmbedTask();
        task.setUserId(userId);
        task.setSource(source);
        task.setSourceId(sourceId);
        task.setAction("delete");
        task.setStatus("pending");
        task.setRetryCount(0);
        task.setMaxRetry(3);
        embedTaskMapper.insert(task);
        log.debug("[EmbedTask] 提交删除任务 source={} sourceId={}", source, sourceId);
    }

    @Override
    public void activateTask(String source, String sourceId, String text) {
        EmbedTask existing = embedTaskMapper.selectPendingBySource(source, sourceId);
        if (existing != null) {
            embedTaskMapper.updateTextSnapshot(existing.getId(), truncate(text));
            embedTaskMapper.updateStatus(existing.getId(), "pending");
            log.debug("[EmbedTask] 激活任务 taskId={}", existing.getId());
        } else {
            log.warn("[EmbedTask] 未找到 waiting_enrich 任务 source={} sourceId={}", source, sourceId);
        }
    }

    private static String truncate(String s) {
        if (s == null) return "";
        String t = s.trim();
        return t.length() > 10000 ? t.substring(0, 10000) : t;
    }
}
