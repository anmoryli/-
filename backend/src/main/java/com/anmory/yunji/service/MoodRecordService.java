package com.anmory.yunji.service;

import com.anmory.yunji.entity.MoodRecord;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 心情记录服务（一天可多次）
 */
public interface MoodRecordService {

    MoodRecord addMoodRecord(Integer userId, LocalDate recordDate, LocalTime recordTime, String mood);

    List<MoodRecord> getMoodRecordsByUserAndDateRange(Integer userId, LocalDate from, LocalDate to);
}
