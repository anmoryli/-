package com.anmory.yunji.service;

import com.anmory.yunji.entity.UserDailyLog;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface UserDailyLogService {

    UserDailyLog getToday(Integer userId);

    int incrementKick(Integer userId);

    UserDailyLog updateMood(Integer userId, String mood);

    UserDailyLog updateWeight(Integer userId, Double weightKg);

    /** 更新当日健康值 0-100 */
    UserDailyLog updateHealthValue(Integer userId, Integer healthValue);

    /** 当日健康值增加 points（上限 100），用于胎动/情绪/放松/饮食等行为即时反馈 */
    UserDailyLog addHealthPoints(Integer userId, int points);

    List<Map<String, Object>> getMoodHistory(Integer userId, int days);

    /** 健康值历史，用于图表展示（日期 + 健康值） */
    List<Map<String, Object>> getHealthValueHistory(Integer userId, int days);
}
