package com.anmory.yunji.service;

import com.anmory.yunji.entity.PregnancyGoalTemplate;
import com.anmory.yunji.entity.UserAchievement;
import com.anmory.yunji.entity.UserGoalProgress;

import java.util.List;
import java.util.Map;

/**
 * 孕期小目标与成就服务
 */
public interface GoalService {

    List<PregnancyGoalTemplate> getTemplates();

    List<Map<String, Object>> getProgressWithTemplates(Integer userId);

    List<UserAchievement> getAchievements(Integer userId);

    /**
     * 记录添加后的回调，用于更新目标进度
     * @param photoCount 本次新增的照片张数（仅 photo 类型时有效）
     */
    void onRecordAdded(Integer userId, String tag, String pregnancyWeek, int photoCount);

    /**
     * 胎动计数增加后的回调
     */
    void onKickIncremented(Integer userId);
}
