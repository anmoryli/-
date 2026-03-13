package com.anmory.yunji.service;

import com.anmory.yunji.entity.UserNotification;

import java.util.List;

public interface UserNotificationService {

    List<UserNotification> listByUserId(Integer userId, int limit);

    int getUnreadCount(Integer userId);

    void markRead(Integer userId, Integer notificationId);

    void markAllRead(Integer userId);

    /** 发送任务分配通知（供 FamilyTaskService 等调用） */
    void notifyTaskAssigned(Integer userId, Integer relatedTaskId, String title, String body);

    /** 提醒创建者先添加配偶（爸爸成长营无配偶时） */
    void notifyNoSpouse(Integer userId);
}
