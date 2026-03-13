package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.UserDailyLog;
import com.anmory.yunji.service.UserDailyLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dailyLog")
public class DailyLogController {

    @Autowired
    private UserDailyLogService userDailyLogService;

    @GetMapping("/today")
    public Result<UserDailyLog> getToday(@RequestParam("userId") Integer userId) {
        UserDailyLog log = userDailyLogService.getToday(userId);
        return Result.success(log);
    }

    @PutMapping("/kick")
    public Result<Integer> incrementKick(@RequestParam("userId") Integer userId) {
        int count = userDailyLogService.incrementKick(userId);
        return Result.success(count);
    }

    @PutMapping("/mood")
    public Result<UserDailyLog> updateMood(@RequestParam("userId") Integer userId,
                                          @RequestParam("mood") String mood) {
        UserDailyLog log = userDailyLogService.updateMood(userId, mood);
        return Result.success(log);
    }

    @PutMapping("/weight")
    public Result<UserDailyLog> updateWeight(@RequestParam("userId") Integer userId,
                                             @RequestParam("weightKg") Double weightKg) {
        UserDailyLog log = userDailyLogService.updateWeight(userId, weightKg);
        return Result.success(log);
    }

    @PutMapping("/healthValue")
    public Result<UserDailyLog> updateHealthValue(@RequestParam("userId") Integer userId,
                                                  @RequestParam("healthValue") Integer healthValue) {
        UserDailyLog log = userDailyLogService.updateHealthValue(userId, healthValue);
        return Result.success(log);
    }

    /** 行为即时反馈：增加当日健康值（胎动/情绪/放松/饮食等完成后由前端或内部调用） */
    @PostMapping("/addHealth")
    public Result<UserDailyLog> addHealthPoints(@RequestParam("userId") Integer userId,
                                                 @RequestParam(value = "points", defaultValue = "5") int points) {
        UserDailyLog log = userDailyLogService.addHealthPoints(userId, Math.min(10, Math.max(1, points)));
        return Result.success(log);
    }

    @GetMapping("/healthHistory")
    public Result<List<Map<String, Object>>> getHealthValueHistory(
            @RequestParam("userId") Integer userId,
            @RequestParam(value = "days", defaultValue = "30") int days) {
        List<Map<String, Object>> history = userDailyLogService.getHealthValueHistory(userId, Math.min(90, Math.max(7, days)));
        return Result.success(history);
    }

    @GetMapping("/moodHistory")
    public Result<List<Map<String, Object>>> getMoodHistory(
            @RequestParam("userId") Integer userId,
            @RequestParam(value = "days", defaultValue = "7") int days) {
        List<Map<String, Object>> history = userDailyLogService.getMoodHistory(userId, days);
        return Result.success(history);
    }
}
