package com.anmory.yunji.scheduler;

import com.anmory.yunji.service.CheckReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CheckReportReminderScheduler {

    private final CheckReportService checkReportService;

    @Scheduled(cron = "${check-report.reminder-cron:0 0 9 * * ?}")
    public void sendDueCheckReminders() {
        log.info("start check report reminder scheduler");
        checkReportService.processScheduledReminders();
    }
}

