package com.anmory.yunji.scheduler;

import com.anmory.yunji.service.ProactiveIceBreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProactiveIceBreakScheduler {

    private final ProactiveIceBreakService proactiveIceBreakService;

    @Value("${proactive.ice-break-probability:0.3}")
    private double iceBreakProbability = 0.3;

    private static final Random RANDOM = new Random();

    @Scheduled(cron = "${proactive.ice-break-cron:0 0 9 * * ?}")
    public void runIceBreak() {
        if (RANDOM.nextDouble() >= iceBreakProbability) {
            log.info("[破冰] 本次跳过（随机概率 {})", iceBreakProbability);
            return;
        }
        log.info("[破冰] 开始执行 AI 主动破冰任务");
        proactiveIceBreakService.createIceBreakConversations();
    }
}
