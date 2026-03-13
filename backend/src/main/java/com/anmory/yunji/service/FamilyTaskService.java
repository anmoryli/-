package com.anmory.yunji.service;

import com.anmory.yunji.entity.FamilyTask;

import java.util.List;
import java.util.Map;

public interface FamilyTaskService {

    List<FamilyTask> listByAssignee(Integer userId);

    List<Map<String, Object>> listByAssigneeWithMeta(Integer userId);

    /** 家庭维度任务列表：校验 requestUserId 属于该家庭后，返回该 familyId 下全部任务（供创建者看「我分配的任务」） */
    List<Map<String, Object>> listByFamilyId(Integer familyId, Integer requestUserId);

    FamilyTask completeTask(Integer userId, Integer taskId);

    FamilyTask createTask(Integer familyId, Integer assigneeUserId, String title, String description, String taskType);

    /** 根据孕周为家庭成员生成本周任务（如陪同产检、情感任务），由孕妇或创建者触发 */
    List<FamilyTask> generateTasksForWeek(Integer userId);

    /** AI 生成本周任务建议（标题+描述），不落库，供前端勾选后批量创建 */
    List<Map<String, String>> suggestTasksForWeek(Integer userId);
}
