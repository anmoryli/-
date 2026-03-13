package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.UserNotification;
import com.anmory.yunji.service.UserNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class UserNotificationController {

    private final UserNotificationService userNotificationService;

    @GetMapping("/list")
    public Result<List<UserNotification>> list(@RequestParam("userId") Integer userId,
                                                @RequestParam(value = "limit", defaultValue = "50") int limit) {
        List<UserNotification> list = userNotificationService.listByUserId(userId, limit);
        return Result.success(list);
    }

    @GetMapping("/unreadCount")
    public Result<Integer> unreadCount(@RequestParam("userId") Integer userId) {
        int count = userNotificationService.getUnreadCount(userId);
        return Result.success(count);
    }

    @PutMapping("/markRead")
    public Result<Void> markRead(@RequestParam("userId") Integer userId,
                                 @RequestParam("notificationId") Integer notificationId) {
        userNotificationService.markRead(userId, notificationId);
        return Result.success();
    }

    @PutMapping("/markAllRead")
    public Result<Void> markAllRead(@RequestParam("userId") Integer userId) {
        userNotificationService.markAllRead(userId);
        return Result.success();
    }

    @PostMapping("/remindNoSpouse")
    public Result<Void> remindNoSpouse(@RequestParam("userId") Integer userId) {
        userNotificationService.notifyNoSpouse(userId);
        return Result.success();
    }
}
