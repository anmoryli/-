package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.dto.EmotionPregnancySummaryDto;
import com.anmory.yunji.dto.SpouseEmotionSummaryDto;
import com.anmory.yunji.service.EmotionPregnancyDailyHintService;
import com.anmory.yunji.service.EmotionPregnancyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 情绪-孕周：妈妈端曲线与温暖解读、爸爸端妻子趋势摘要
 */
@RestController
@RequestMapping("/api/emotionPregnancy")
@RequiredArgsConstructor
public class EmotionPregnancyController {

    private final EmotionPregnancyService emotionPregnancyService;
    private final EmotionPregnancyDailyHintService emotionPregnancyDailyHintService;

    /**
     * 妈妈端：按孕周聚合情绪与体重，返回曲线数据 + 温暖解读
     *
     * @param userId 孕妇（家庭创建者）userId，需为当前登录用户本人
     */
    @GetMapping("/summary")
    public Result<EmotionPregnancySummaryDto> summary(@RequestParam("userId") Integer userId) {
        if (userId == null) {
            return Result.error("userId 不能为空");
        }
        EmotionPregnancySummaryDto dto = emotionPregnancyService.getSummary(userId);
        return Result.success(dto);
    }

    /**
     * 爸爸端：妻子情绪趋势轻量摘要（不包含具体日记）
     *
     * @param requestUserId 配偶（爸爸）userId，需为当前登录用户
     */
    @GetMapping("/spouseSummary")
    public Result<SpouseEmotionSummaryDto> spouseSummary(@RequestParam("requestUserId") Integer requestUserId) {
        if (requestUserId == null) {
            return Result.error("requestUserId 不能为空");
        }
        SpouseEmotionSummaryDto dto = emotionPregnancyService.getSpouseSummary(requestUserId);
        return Result.success(dto);
    }

    /**
     * 情绪孕周每日一句（0 点定时任务写入 Redis，此处只读）
     *
     * @param userId 孕妇用户 ID
     */
    @GetMapping("/dailyHint")
    public Result<String> dailyHint(@RequestParam("userId") Integer userId) {
        if (userId == null) {
            return Result.error("userId 不能为空");
        }
        String hint = emotionPregnancyDailyHintService.getDailyHint(userId);
        return Result.success(hint != null ? hint : "");
    }
}
