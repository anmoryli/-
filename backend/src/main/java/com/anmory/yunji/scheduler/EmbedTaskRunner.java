package com.anmory.yunji.scheduler;

import com.anmory.yunji.common.RagService;
import com.anmory.yunji.entity.EmbedTask;
import com.anmory.yunji.mapper.EmbedTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 嵌入任务调度器
 * 定时扫描 pending 任务，调用 RAG 执行嵌入或删除，失败重试
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmbedTaskRunner {

    private static final int BATCH_SIZE = 50;

    private final EmbedTaskMapper embedTaskMapper;
    private final RagService ragService;

    @Scheduled(fixedDelay = 10_000)
    public void processPendingTasks() {
        List<EmbedTask> tasks = embedTaskMapper.selectPending(BATCH_SIZE);
        for (EmbedTask task : tasks) {
            try {
                embedTaskMapper.updateStatus(task.getId(), "processing");

                if ("delete".equals(task.getAction())) {
                    ragService.deleteBySourceId(task.getSource(), task.getSourceId());
                } else {
                    String text = task.getTextSnapshot();
                    if (text == null || text.isBlank()) {
                        log.warn("[嵌入] 任务文本为空，跳过 taskId={} source={} sourceId={}",
                                task.getId(), task.getSource(), task.getSourceId());
                        embedTaskMapper.updateStatus(task.getId(), "failed");
                        continue;
                    }
                    ragService.embedSync(task.getUserId(), text, task.getSource(), task.getSourceId());
                }

                embedTaskMapper.updateStatus(task.getId(), "success");

            } catch (Exception e) {
                int newRetry = (task.getRetryCount() != null ? task.getRetryCount() : 0) + 1;
                String errMsg = e.getMessage();
                if (errMsg != null && errMsg.length() > 500) errMsg = errMsg.substring(0, 500);

                if (newRetry >= (task.getMaxRetry() != null ? task.getMaxRetry() : 3)) {
                    embedTaskMapper.markFailed(task.getId(), newRetry, errMsg);
                    log.error("[嵌入] 任务最终失败 taskId={} source={} sourceId={}",
                            task.getId(), task.getSource(), task.getSourceId(), e);
                } else {
                    embedTaskMapper.markRetry(task.getId(), newRetry, errMsg);
                    log.warn("[嵌入] 任务重试 {}/{} taskId={} source={} sourceId={}",
                            newRetry, task.getMaxRetry(), task.getId(), task.getSource(), task.getSourceId());
                }
            }
        }
    }
}
