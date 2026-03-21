package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.PregnancyGoalTemplate;
import com.anmory.yunji.entity.UserAchievement;
import com.anmory.yunji.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goal")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping("/templates")
    public Result<List<PregnancyGoalTemplate>> getTemplates() {
        List<PregnancyGoalTemplate> list = goalService.getTemplates();
        return Result.success(list);
    }

    @GetMapping("/progress")
    public Result<List<Map<String, Object>>> getProgress(@RequestParam("userId") Integer userId) {
        List<Map<String, Object>> list = goalService.getProgressWithTemplates(userId);
        return Result.success(list);
    }

    @GetMapping("/achievements")
    public Result<List<UserAchievement>> getAchievements(@RequestParam("userId") Integer userId) {
        List<UserAchievement> list = goalService.getAchievements(userId);
        return Result.success(list);
    }
}
