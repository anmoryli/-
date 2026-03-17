package com.anmory.yunji.scheduler;

import com.anmory.yunji.entity.ScheduledOperation;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.entity.UserNotification;
import com.anmory.yunji.mapper.ScheduledOperationMapper;
import com.anmory.yunji.mapper.UserNotificationMapper;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.ReminderRewriteService;
import com.anmory.yunji.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledOperationRunner {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("M月d日 HH:mm");

    private final ScheduledOperationMapper scheduledOperationMapper;
    private final UserNotificationMapper userNotificationMapper;
    private final UserService userService;
    private final MailService mailService;
    private final ReminderRewriteService reminderRewriteService;

    @Scheduled(fixedDelay = 60_000)
    public void processDue() {
        List<ScheduledOperation> due;
        try {
            due = scheduledOperationMapper.selectDue(LocalDateTime.now());
        } catch (Exception e) {
            log.warn("定时任务无法连接数据库，跳过本轮 processDue: {}", e.getMessage());
            return;
        }
        for (ScheduledOperation op : due) {
            try {
                String sendBody = reminderRewriteService.rewriteForSend(op.getContent());
                UserNotification n = new UserNotification();
                n.setUserId(op.getUserId());
                n.setType("reminder");
                n.setTitle("提醒");
                n.setBody(sendBody);
                n.setRelatedTaskId(null);
                userNotificationMapper.insert(n);

                User user = userService.getById(op.getUserId());
                if (user != null && user.getEmail() != null && !user.getEmail().isBlank() && !Boolean.FALSE.equals(user.getEmailEnabled())) {
                    String timeDesc = op.getNextRunAt() != null ? op.getNextRunAt().format(FMT) : "当前";
                    String subject = "孕期宝 · 提醒";
                    String body = "您有一条提醒：\n\n" + sendBody + "\n\n时间：" + timeDesc + "\n\n—— 孕期宝";
                    try {
                        mailService.sendTextMail(user.getEmail(), subject, body);
                    } catch (Exception e) {
                        log.warn("定时提醒邮件发送失败 opId={} userId={}", op.getId(), op.getUserId(), e);
                    }
                }

                LocalDateTime nextRun = null;
                String status = "done";
                if ("daily".equals(op.getScheduleType()) && op.getRunTime() != null && !op.getRunTime().isBlank()) {
                    try {
                        LocalTime t = LocalTime.parse(op.getRunTime(), DateTimeFormatter.ofPattern("HH:mm"));
                        nextRun = LocalDate.now().plusDays(1).atTime(t);
                        status = "pending";
                    } catch (Exception ignored) {}
                }
                scheduledOperationMapper.updateNextRun(op.getId(), nextRun, status);
            } catch (Exception e) {
                log.warn("定时提醒执行失败 opId={}", op.getId(), e);
            }
        }
    }
}
