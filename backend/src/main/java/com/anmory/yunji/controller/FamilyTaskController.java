package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.FamilyTask;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.FamilyTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/family/tasks")
@RequiredArgsConstructor
public class FamilyTaskController {

    private final FamilyTaskService familyTaskService;
    private final FamilyService familyService;

    @GetMapping("/my")
    public Result<List<Map<String, Object>>> myTasks(@RequestParam("userId") Integer userId) {
        List<Map<String, Object>> list = familyTaskService.listByAssigneeWithMeta(userId);
        return Result.success(list);
    }

    /** 家庭维度任务列表：仅当 userId 属于该家庭时返回该家庭下全部任务（创建者用此接口展示「我分配的任务」） */
    @GetMapping("/family")
    public Result<List<Map<String, Object>>> familyTasks(@RequestParam("familyId") Integer familyId,
                                                         @RequestParam("userId") Integer userId) {
        List<Map<String, Object>> list = familyTaskService.listByFamilyId(familyId, userId);
        return Result.success(list);
    }

    @PutMapping("/complete")
    public Result<FamilyTask> complete(@RequestParam("userId") Integer userId,
                                      @RequestParam("taskId") Integer taskId) {
        FamilyTask t = familyTaskService.completeTask(userId, taskId);
        return Result.success(t);
    }

    @PostMapping("/create")
    public Result<FamilyTask> create(@RequestParam("userId") Integer userId,
                                     @RequestParam("familyId") Integer familyId,
                                     @RequestParam("assigneeUserId") Integer assigneeUserId,
                                     @RequestParam("title") String title,
                                     @RequestParam(value = "description", required = false) String description,
                                     @RequestParam(value = "taskType", defaultValue = "routine") String taskType) {
        Family family = familyService.getMyFamily(userId);
        if (family == null || !family.getFamilyId().equals(familyId)) {
            return Result.error(403, "FORBIDDEN", "无权限在该家庭创建任务");
        }
        FamilyTask t = familyTaskService.createTask(familyId, assigneeUserId, title, description, taskType);
        return Result.success(t);
    }

    @PostMapping("/generateForWeek")
    public Result<List<FamilyTask>> generateForWeek(@RequestParam("userId") Integer userId) {
        List<FamilyTask> list = familyTaskService.generateTasksForWeek(userId);
        return Result.success(list);
    }

    /** AI 生成本周任务建议（不落库），前端可勾选后逐条调用 create 或批量创建 */
    @GetMapping("/suggest")
    public Result<List<Map<String, String>>> suggest(@RequestParam("userId") Integer userId) {
        List<Map<String, String>> list = familyTaskService.suggestTasksForWeek(userId);
        return Result.success(list);
    }
}
