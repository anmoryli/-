package com.anmory.yunji.service;

import com.anmory.yunji.entity.CheckReport;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CheckReportService {
    CheckReport uploadAndParse(Integer userId, MultipartFile file, String extraText);

    List<CheckReport> listByUserId(Integer userId);

    void processScheduledReminders();
}

