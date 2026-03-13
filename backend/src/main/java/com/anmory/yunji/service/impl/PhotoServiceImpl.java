package com.anmory.yunji.service.impl;

import com.anmory.yunji.mapper.PhotoMapper;
import com.anmory.yunji.service.PhotoServie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PhotoServiceImpl implements PhotoServie {

    @Autowired
    private PhotoMapper photoMapper;

    @Override
    public Integer getPhotoCount() {

        Integer photoCount = photoMapper.selectCount();
        return photoCount;
    }
}
