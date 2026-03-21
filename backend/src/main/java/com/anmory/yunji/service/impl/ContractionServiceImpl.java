package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Contraction;
import com.anmory.yunji.mapper.ContractionMapper;
import com.anmory.yunji.service.ContractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ContractionServiceImpl implements ContractionService {

    @Autowired
    private ContractionMapper contractionMapper;

    @Override
    public Contraction add(Integer userId, java.time.LocalDateTime startedAt, int durationSeconds) {
        Contraction c = new Contraction();
        c.setUserId(userId);
        c.setStartedAt(startedAt);
        c.setDurationSeconds(durationSeconds);
        contractionMapper.insert(c);
        return c;
    }

    @Override
    public List<Contraction> listByDate(Integer userId, LocalDate date) {
        return contractionMapper.findByUserAndDate(userId, date);
    }

    @Override
    public void clearByDate(Integer userId, LocalDate date) {
        contractionMapper.deleteByUserAndDate(userId, date);
    }
}
