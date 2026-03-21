package com.anmory.yunji.service.impl;

import com.anmory.yunji.mapper.VoiceMapper;
import com.anmory.yunji.service.VoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VoiceServiceImpl implements VoiceService {

    @Autowired
    private VoiceMapper voiceMapper;

    @Override
    public Integer getVoiceCount() {

        Integer voiceCount = voiceMapper.selectCount();
        return voiceCount;
    }
}
