package com.anmory.yunji.service;

/**
 * 情绪孕周每日一句：Redis 存储、0 点定时刷新、接口读取。
 */
public interface EmotionPregnancyDailyHintService {

    /**
     * 获取当日情绪孕周提示（从 Redis 读取，0 点由定时任务写入）
     *
     * @param userId 孕妇用户 ID
     * @return ≤30 字的一句，无则返回 null
     */
    String getDailyHint(Integer userId);

    /**
     * 计算并写入 Redis（供定时任务调用）
     *
     * @param userId 孕妇用户 ID
     */
    void computeAndStore(Integer userId);
}
