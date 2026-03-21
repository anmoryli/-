package com.anmory.yunji.scheduler;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.mapper.FamilyMapper;
import com.anmory.yunji.service.EmotionPregnancyDailyHintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 情绪孕周每日一句：每天 0 点为每位孕妇计算并写入 Redis（24h TTL）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmotionPregnancyDailyHintScheduler {

    private final FamilyMapper familyMapper;
    private final EmotionPregnancyDailyHintService emotionPregnancyDailyHintService;

    @Scheduled(cron = "${emotion-pregnancy.daily-hint-cron:0 0 0 * * ?}")
    public void refreshDailyHints() {
        List<Family> families;
        try {
            families = familyMapper.selectAll();
        } catch (Exception e) {
            log.warn("[情绪孕周每日一句] 查询家庭列表失败: {}", e.getMessage());
            return;
        }
        if (families == null || families.isEmpty()) return;

        for (Family family : families) {
            if (family.getCreatorUserId() == null) continue;
            try {
                emotionPregnancyDailyHintService.computeAndStore(family.getCreatorUserId());
            } catch (Exception e) {
                log.warn("[情绪孕周每日一句] 计算失败 creatorUserId={}", family.getCreatorUserId(), e);
            }
        }
        log.info("[情绪孕周每日一句] 已刷新 {} 个家庭", families.size());
    }
}
