package com.anmory.yunji.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 定时意图会话草稿状态（内存存储，key: sched_draft:{conversationId}）。
 * 用于多轮补全时间、地点、干什么、备注后再写入 scheduled_operation。
 */
@Component
public class ScheduleDraftStore {

    private static final String PREFIX = "sched_draft:";
    private final ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();

    public String get(Integer conversationId) {
        if (conversationId == null) return null;
        return map.get(PREFIX + conversationId);
    }

    public void set(Integer conversationId, String stateJson) {
        if (conversationId == null) return;
        if (stateJson == null || stateJson.isBlank()) {
            map.remove(PREFIX + conversationId);
        } else {
            map.put(PREFIX + conversationId, stateJson);
        }
    }

    public void remove(Integer conversationId) {
        if (conversationId == null) return;
        map.remove(PREFIX + conversationId);
    }
}
