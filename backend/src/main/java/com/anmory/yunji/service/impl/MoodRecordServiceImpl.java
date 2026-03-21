package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.MoodRecord;
import com.anmory.yunji.mapper.MoodRecordMapper;
import com.anmory.yunji.service.MoodRecordService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class MoodRecordServiceImpl implements MoodRecordService {

    private final MoodRecordMapper moodRecordMapper;

    public MoodRecordServiceImpl(MoodRecordMapper moodRecordMapper) {
        this.moodRecordMapper = moodRecordMapper;
    }

    @Override
    public MoodRecord addMoodRecord(Integer userId, LocalDate recordDate, LocalTime recordTime, String mood) {
        if (userId == null || recordDate == null || recordTime == null || mood == null || mood.isBlank()) {
            return null;
        }
        MoodRecord r = new MoodRecord();
        r.setUserId(userId);
        r.setRecordDate(recordDate);
        r.setRecordTime(recordTime);
        r.setMood(mood.trim());
        moodRecordMapper.insert(r);
        return r;
    }

    @Override
    public List<MoodRecord> getMoodRecordsByUserAndDateRange(Integer userId, LocalDate from, LocalDate to) {
        if (userId == null || from == null || to == null) {
            return List.of();
        }
        return moodRecordMapper.findByUserAndDateRange(userId, from, to);
    }
}
