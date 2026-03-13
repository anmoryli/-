package com.anmory.yunji.service;

import com.anmory.yunji.common.Result;

public interface AiService {
    // 意图识别
    Result<String> identifyIntent(String text);
}
