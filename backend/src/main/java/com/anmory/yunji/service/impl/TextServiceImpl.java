package com.anmory.yunji.service.impl;

import com.anmory.yunji.mapper.TextMapper;
import com.anmory.yunji.service.TextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TextServiceImpl implements TextService {

    @Autowired
    private TextMapper textMapper;

    @Override
    public Integer getTextCount() {

        return textMapper.getTextCount();
    }
}
