package com.anmory.yunji.service;

import com.anmory.yunji.entity.RelaxMusic;
import java.util.List;

public interface RelaxMusicService {
    List<RelaxMusic> listEnabled();
    List<RelaxMusic> listAll();
    List<RelaxMusic> listByCategory(String category);
    RelaxMusic getById(Integer musicId);
    RelaxMusic create(RelaxMusic music);
    RelaxMusic update(RelaxMusic music);
    boolean delete(Integer musicId);
}
