package com.anmory.yunji.service;

/**
 * 将提醒的原始内容（如「明天去人民公园」）在发送时刻改写成带入场景的文案（如「准备出发去人民公园吧」）。
 */
public interface ReminderRewriteService {

    /**
     * 根据原始提醒内容生成一句适合当前时刻发送的简短文案；失败时返回原始内容。
     */
    String rewriteForSend(String rawContent);
}
