package com.anmory.yunji.scheduler;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.FamilyMember;
import com.anmory.yunji.mapper.FamilyMapper;
import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.mapper.UserNotificationMapper;
import com.anmory.yunji.service.EmotionPregnancyService;
import com.anmory.yunji.service.UserNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;

/**
 * 配偶关怀提醒：每周对「情绪波动较大」的孕妇的配偶推送一次站内提醒，同一配偶一周内只发一次。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpouseCareReminderScheduler {

    private static final String NOTIFICATION_TYPE = "care_reminder";

    private final FamilyMapper familyMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final EmotionPregnancyService emotionPregnancyService;
    private final UserNotificationService userNotificationService;
    private final UserNotificationMapper userNotificationMapper;

    @Scheduled(cron = "${spouse-care.cron:0 0 20 * * SUN}")
    public void sendSpouseCareReminders() {
        List<Family> families;
        try {
            families = familyMapper.selectAll();
        } catch (Exception e) {
            log.warn("[配偶关怀] 查询家庭列表失败: {}", e.getMessage());
            return;
        }
        if (families == null || families.isEmpty()) return;

        int weekOfYear = LocalDate.now().get(WeekFields.ISO.weekOfYear());
        String titleSuffix = "关怀提醒（第" + weekOfYear + "周）";

        for (Family family : families) {
            if (family.getCreatorUserId() == null) continue;
            List<FamilyMember> members = familyMemberMapper.findByFamilyId(family.getFamilyId());
            if (members == null) continue;
            List<Integer> spouseUserIds = members.stream()
                    .filter(m -> Boolean.TRUE.equals(m.getIsSpouse()) && !m.getUserId().equals(family.getCreatorUserId()))
                    .map(FamilyMember::getUserId)
                    .toList();
            if (spouseUserIds.isEmpty()) continue;

            String trend;
            try {
                trend = emotionPregnancyService.computeTrend(family.getCreatorUserId());
            } catch (Exception e) {
                log.debug("[配偶关怀] 计算趋势失败 creatorId={}", family.getCreatorUserId(), e);
                continue;
            }
            if (!"fluctuating".equals(trend) && !"need_support".equals(trend)) continue;

            String body = "老婆这周情绪波动稍大，今晚可以多陪她说说话。";
            for (Integer spouseUserId : spouseUserIds) {
                try {
                    int existing = userNotificationMapper.countByUserIdAndTypeAndTitle(spouseUserId, NOTIFICATION_TYPE, titleSuffix);
                    if (existing > 0) continue;
                    userNotificationService.notifySystem(spouseUserId, titleSuffix, body);
                    log.info("[配偶关怀] 已推送 spouseUserId={} creatorUserId={}", spouseUserId, family.getCreatorUserId());
                } catch (Exception e) {
                    log.warn("[配偶关怀] 推送失败 spouseUserId={}", spouseUserId, e);
                }
            }
        }
    }
}
