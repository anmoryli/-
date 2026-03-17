package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.MoodRecord;
import com.anmory.yunji.service.MoodRecordService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/moodRecord")
public class MoodRecordController {

    private final MoodRecordService moodRecordService;

    public MoodRecordController(MoodRecordService moodRecordService) {
        this.moodRecordService = moodRecordService;
    }

    @PostMapping("/add")
    public Result<MoodRecord> add(@RequestParam("userId") Integer userId,
                                  @RequestParam(value = "recordDate", required = false) LocalDate recordDate,
                                  @RequestParam(value = "recordTime", required = false) String recordTimeStr,
                                  @RequestParam("mood") String mood) {
        if (recordDate == null) recordDate = LocalDate.now();
        LocalTime recordTime;
        if (recordTimeStr != null && !recordTimeStr.isBlank()) {
            try {
                recordTime = LocalTime.parse(recordTimeStr);
            } catch (Exception e) {
                recordTime = LocalTime.now();
            }
        } else {
            recordTime = LocalTime.now();
        }
        MoodRecord r = moodRecordService.addMoodRecord(userId, recordDate, recordTime, mood);
        return r != null ? Result.success(r) : Result.error(400, "BAD_REQUEST", "参数不完整");
    }

    @GetMapping("/history")
    public Result<List<MoodRecord>> history(@RequestParam("userId") Integer userId,
                                            @RequestParam(value = "days", defaultValue = "7") int days) {
        if (userId == null) return Result.error(400, "BAD_REQUEST", "缺少 userId");
        days = Math.min(90, Math.max(1, days));
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        List<MoodRecord> list = moodRecordService.getMoodRecordsByUserAndDateRange(userId, from, to);
        return Result.success(list != null ? list : List.of());
    }
}
