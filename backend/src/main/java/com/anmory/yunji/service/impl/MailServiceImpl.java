package com.anmory.yunji.service.impl;

import com.anmory.yunji.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

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

    @Override
    public void sendHtmlMail(String to, String subject, String htmlContent) {
        if (to == null || !to.contains("@")) {
            log.warn("[邮件] 收件人地址无效，跳过发送 to={}", to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(getFromAddress());
            helper.setTo(to.trim());
            helper.setSubject(subject != null ? subject : "");
            helper.setText(htmlContent != null ? htmlContent : "", true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.warn("[邮件] HTML 发送失败 to={}", to, e);
            throw new RuntimeException("邮件发送失败", e);
        }
    }

    @Override
    public void sendHtmlMailWithAttachment(String to, String subject, String htmlContent, String attachmentFileName, byte[] attachmentBytes) {
        if (to == null || !to.contains("@")) {
            log.warn("[邮件] 收件人地址无效，跳过发送 to={}", to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(getFromAddress());
            helper.setTo(to.trim());
            helper.setSubject(subject != null ? subject : "");
            helper.setText(htmlContent != null ? htmlContent : "", true);
            if (attachmentFileName != null && attachmentBytes != null && attachmentBytes.length > 0) {
                helper.addAttachment(attachmentFileName, () -> new java.io.ByteArrayInputStream(attachmentBytes));
            }
            mailSender.send(message);
        } catch (MessagingException e) {
            log.warn("[邮件] 带附件 HTML 发送失败 to={}", to, e);
            throw new RuntimeException("邮件发送失败", e);
        }
    }

    /** 与 APP 风格一致的暖色系 HTML 模板（浅粉/米色背景、深灰文字、圆角卡片感） */
    public static String wrapHtmlBody(String innerContent) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:20px;background:#faf6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2d2b29;line-height:1.6;\">"
                + "<div style=\"max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);\">"
                + (innerContent != null ? innerContent : "")
                + "</div></body></html>";
    }
}

