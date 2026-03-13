package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.UserDailyLog;
import com.anmory.yunji.mapper.UserDailyLogMapper;
import com.anmory.yunji.service.GoalService;
import com.anmory.yunji.service.UserDailyLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserDailyLogServiceImpl implements UserDailyLogService {

    @Autowired
    private UserDailyLogMapper userDailyLogMapper;

    @Autowired
    private GoalService goalService;

    @Override
    public UserDailyLog getToday(Integer userId) {
        LocalDate today = LocalDate.now();
        UserDailyLog log = userDailyLogMapper.findByUserAndDate(userId, today);
        if (log == null) {
            log = new UserDailyLog();
            log.setUserId(userId);
            log.setRecordDate(today);
            log.setKickCount(0);
            userDailyLogMapper.insert(log);
        }
        return log;
    }

    @Override
    public int incrementKick(Integer userId) {
        UserDailyLog log = getToday(userId);
        int count = (log.getKickCount() == null ? 0 : log.getKickCount()) + 1;
        log.setKickCount(count);
        userDailyLogMapper.update(log);
        addHealthPoints(userId, 5);
        try {
            goalService.onKickIncremented(userId);
        } catch (Exception e) {
            // ignore goal update failure
        }
        return count;
    }

    @Override
    public UserDailyLog updateMood(Integer userId, String mood) {
        UserDailyLog log = getToday(userId);
        log.setMood(mood);
        userDailyLogMapper.update(log);
        addHealthPoints(userId, 3);
        return log;
    }

    @Override
    public UserDailyLog updateWeight(Integer userId, Double weightKg) {
        UserDailyLog log = getToday(userId);
        log.setWeightKg(weightKg);
        userDailyLogMapper.update(log);
        return log;
    }

    @Override
    public UserDailyLog updateHealthValue(Integer userId, Integer healthValue) {
        UserDailyLog log = getToday(userId);
        if (healthValue != null && (healthValue < 0 || healthValue > 100)) {
            healthValue = null;
        }
        log.setHealthValue(healthValue);
        userDailyLogMapper.update(log);
        return log;
    }

    @Override
    public UserDailyLog addHealthPoints(Integer userId, int points) {
        if (points <= 0) return getToday(userId);
        UserDailyLog log = getToday(userId);
        int current = (log.getHealthValue() == null ? 0 : log.getHealthValue());
        int next = Math.min(100, current + points);
        log.setHealthValue(next);
        userDailyLogMapper.update(log);
        return log;
    }

    @Override
    public List<Map<String, Object>> getMoodHistory(Integer userId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1);
        List<UserDailyLog> logs = userDailyLogMapper.findByUserAndDateRange(userId, start, end);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserDailyLog l : logs) {
            Map<String, Object> m = new HashMap<>();
            m.put("date", l.getRecordDate().toString());
            m.put("mood", l.getMood());
            m.put("kickCount", l.getKickCount());
            m.put("weightKg", l.getWeightKg());
            m.put("healthValue", l.getHealthValue());
            result.add(m);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getHealthValueHistory(Integer userId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1);
        List<UserDailyLog> logs = userDailyLogMapper.findByUserAndDateRange(userId, start, end);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserDailyLog l : logs) {
            Map<String, Object> m = new HashMap<>();
            m.put("date", l.getRecordDate().toString());
            m.put("healthValue", l.getHealthValue() != null ? l.getHealthValue() : 0);
            result.add(m);
        }
        return result;
    }
}
