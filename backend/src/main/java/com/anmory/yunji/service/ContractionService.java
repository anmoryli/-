package com.anmory.yunji.service;

import com.anmory.yunji.entity.Contraction;

import java.time.LocalDate;
import java.util.List;

public interface ContractionService {

    Contraction add(Integer userId, java.time.LocalDateTime startedAt, int durationSeconds);

    List<Contraction> listByDate(Integer userId, LocalDate date);

    void clearByDate(Integer userId, LocalDate date);
}
