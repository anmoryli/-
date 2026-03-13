package com.anmory.yunji.service.impl;

import com.anmory.yunji.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private static final String DEFAULT_FROM = "noreply@yunqibao.local";

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    /** 合法的发件人地址：非空且包含 @，否则用默认值避免 MailParseException */
    private String getFromAddress() {
        if (from != null && !from.isBlank() && from.contains("@")) {
            return from.trim();
        }
        if (log.isWarnEnabled()) {
            log.warn("[邮件] spring.mail.username 未配置或格式无效，使用默认发件人。请配置 MAIL_USERNAME（如 QQ 邮箱）以正常发信。");
        }
        return DEFAULT_FROM;
    }

    @Override
    public void sendTextMail(String to, String subject, String content) {
        if (to == null || !to.contains("@")) {
            log.warn("[邮件] 收件人地址无效，跳过发送 to={}", to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(getFromAddress());
        message.setTo(to.trim());
        message.setSubject(subject != null ? subject : "");
        message.setText(content != null ? content : "");
        mailSender.send(message);
    }
}

