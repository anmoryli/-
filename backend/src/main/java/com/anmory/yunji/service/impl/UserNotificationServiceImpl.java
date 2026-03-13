package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.UserNotification;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.mapper.UserNotificationMapper;
import com.anmory.yunji.service.UserNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class UserNotificationServiceImpl implements UserNotificationService {

    private final UserNotificationMapper userNotificationMapper;

    @Override
    public List<UserNotification> listByUserId(Integer userId, int limit) {
        if (userId == null) return List.of();
        return userNotificationMapper.selectByUserId(userId, Math.min(limit, 100));
    }

    @Override
    public int getUnreadCount(Integer userId) {
        if (userId == null) return 0;
        return userNotificationMapper.countUnreadByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markRead(Integer userId, Integer notificationId) {
        if (notificationId == null || userId == null) return;
        UserNotification n = userNotificationMapper.selectByIdAndUserId(notificationId, userId);
        if (n == null) throw new BusinessException("通知不存在或无权限");
        userNotificationMapper.markRead(notificationId, LocalDateTime.now());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markAllRead(Integer userId) {
        if (userId == null) return;
        userNotificationMapper.markAllReadByUserId(userId, LocalDateTime.now());
    }

    @Override
    public void notifyNoSpouse(Integer userId) {
        if (userId == null) return;
        String title = "添加配偶后可分配任务";
        if (userNotificationMapper.countByUserIdAndTypeAndTitle(userId, "reminder", title) > 0) return;
        UserNotification n = new UserNotification();
        n.setUserId(userId);
        n.setType("reminder");
        n.setTitle(title);
        n.setBody("您还未添加配偶，请在家人共享中添加配偶后再为TA分配任务。");
        n.setRelatedTaskId(null);
        userNotificationMapper.insert(n);
    }

    public void notifyTaskAssigned(Integer userId, Integer relatedTaskId, String title, String body) {
        UserNotification n = new UserNotification();
        n.setUserId(userId);
        n.setType("task_assigned");
        n.setTitle(title != null ? title : "新任务");
        n.setBody(body);
        n.setRelatedTaskId(relatedTaskId);
        userNotificationMapper.insert(n);
    }
}
