package com.anmory.yunji.scheduler;

import com.anmory.yunji.service.ProactiveIceBreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProactiveIceBreakScheduler {

    private final ProactiveIceBreakService proactiveIceBreakService;

    @Scheduled(cron = "${proactive.ice-break-cron:0 0 9 * * ?}")
    public void runIceBreak() {
        log.info("[破冰] 开始执行 AI 主动破冰任务");
        proactiveIceBreakService.createIceBreakConversations();
    }
}
