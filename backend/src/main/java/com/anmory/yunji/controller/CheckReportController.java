package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.CheckReport;
import com.anmory.yunji.service.CheckReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/check-report")
@RequiredArgsConstructor
public class CheckReportController {

    private final CheckReportService checkReportService;

    @PostMapping("/upload")
    public Result<CheckReport> upload(@RequestParam("userId") Integer userId,
                                      @RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "extraText", required = false) String extraText) {
        return Result.success(checkReportService.uploadAndParse(userId, file, extraText));
    }

    @GetMapping("/list")
    public Result<List<CheckReport>> list(@RequestParam("userId") Integer userId) {
        return Result.success(checkReportService.listByUserId(userId));
    }
}

