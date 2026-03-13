package com.anmory.yunji.service.impl;

import com.anmory.yunji.mapper.MessageMapper;
import com.anmory.yunji.mapper.UserMapper;
import com.anmory.yunji.service.ConversationService;
import com.anmory.yunji.service.ProactiveIceBreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProactiveIceBreakServiceImpl implements ProactiveIceBreakService {

    private final UserMapper userMapper;
    private final MessageMapper messageMapper;
    private final ConversationService conversationService;

    @Value("${proactive.ice-break-inactive-days:3}")
    private int inactiveDays = 3;

    private static final String[] ICE_BREAK_TITLES = {
        "想和你聊聊～",
        "今天感觉怎么样？",
        "有什么想记录的吗？"
    };

    @Override
    public void createIceBreakConversations() {
        try {
            List<Integer> pregnantIds = userMapper.selectPregnantUserIds();
            if (pregnantIds == null || pregnantIds.isEmpty()) return;

            LocalDateTime since = LocalDateTime.now().minusDays(inactiveDays);
            List<Integer> activeIds = messageMapper.selectUserIdsWithUserMessageAfter(since);
            if (activeIds == null) activeIds = new ArrayList<>();

            List<Integer> inactiveIds = new ArrayList<>();
            for (Integer id : pregnantIds) {
                if (!activeIds.contains(id)) inactiveIds.add(id);
            }

            if (inactiveIds.isEmpty()) {
                log.info("[破冰] 无待破冰用户");
                return;
            }

            for (Integer userId : inactiveIds) {
                try {
                    String title = ICE_BREAK_TITLES[(int) (System.currentTimeMillis() % ICE_BREAK_TITLES.length)];
                    conversationService.create(userId, title);
                    log.info("[破冰] 已为用户 {} 创建破冰会话", userId);
                } catch (Exception ex) {
                    log.warn("[破冰] 为用户 {} 创建会话失败", userId, ex);
                }
            }
        } catch (Exception ex) {
            log.error("[破冰] 任务执行失败", ex);
        }
    }
}
