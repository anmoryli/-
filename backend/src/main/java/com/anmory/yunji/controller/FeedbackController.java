package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 用户反馈/联系客服：将意见直接发送到客服邮箱，不打开本地邮件客户端。
 */
@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private static final String SUPPORT_EMAIL = "anmory@qq.com";

    private final MailService mailService;

    @PostMapping("/send")
    public Result<Void> sendFeedback(
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "userId", required = false) Integer userId) {
        String sub = (subject != null && !subject.isBlank()) ? subject.trim() : "孕期宝 - 用户咨询";
        String body = (content != null && !content.isBlank()) ? content.trim() : "（用户未填写内容）";
        if (userId != null && userId > 0) {
            body = "【用户ID: " + userId + "】\n\n" + body;
        }
        try {
            mailService.sendTextMail(SUPPORT_EMAIL, sub, body);
            log.info("[反馈] 已发送至 {} subject={}", SUPPORT_EMAIL, sub);
            return Result.success();
        } catch (Exception e) {
            log.warn("[反馈] 发送失败", e);
            return Result.error(500, "SEND_FAILED", "发送失败，请稍后重试");
        }
    }
}
