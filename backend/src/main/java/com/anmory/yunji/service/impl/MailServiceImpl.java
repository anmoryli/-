package com.anmory.yunji.service.impl;

import com.anmory.yunji.service.MailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

@Service
public class MailServiceImpl implements MailService {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private static final String DEFAULT_FROM = "noreply@yunqibao.local";

    private final JavaMailSender mailSender;

    public MailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

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
        Thread t = Thread.currentThread();
        ClassLoader prev = t.getContextClassLoader();
        try {
            // 异步线程（如 PDF 导出的 ForkJoinPool）的 ContextClassLoader 可能看不到应用 jar，导致
            // ServiceLoader 找不到 jakarta.mail.util.StreamProvider，统一用本类的 ClassLoader 再发邮件
            t.setContextClassLoader(MailServiceImpl.class.getClassLoader());
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getFromAddress());
            message.setTo(to.trim());
            message.setSubject(subject != null ? subject : "");
            message.setText(content != null ? content : "");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("[邮件] 发送失败 to={}", to, e);
            throw new RuntimeException("邮件发送失败", e);
        } finally {
            t.setContextClassLoader(prev);
        }
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
        Thread thread = Thread.currentThread();
        ClassLoader prev = thread.getContextClassLoader();
        try {
            thread.setContextClassLoader(MailServiceImpl.class.getClassLoader());
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
        } finally {
            thread.setContextClassLoader(prev);
        }
    }

    /** 与 APP 风格一致的暖色系 HTML 模板（浅粉/米色背景、深灰文字、圆角卡片感） */
    public static String wrapHtmlBody(String innerContent) {
        return wrapHtmlBodyWithStyle(innerContent);
    }

    /**
     * 与 app 一致：配色 + 渐变背景；可选缓动动画（部分邮件客户端不支持，以渐变 fallback 为主）。
     * 色值对应 globals.css：background #FDFAF7，gradient-b #F5F0EC，gradient-c #F0EDE8，accent #E3B8B0，sage #B8CBB3。
     */
    public static String wrapHtmlBodyWithStyle(String innerContent) {
        String bodyStyle = "margin:0;padding:20px;background:#FDFAF7;background-image:linear-gradient(135deg,#FDFAF7 0%,#F5F0EC 40%,#F0EDE8 70%,#FDFAF7 100%);background-size:200% 200%;"
                + "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#3D3B39;line-height:1.6;";
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<style type=\"text/css\">"
                + "@keyframes mailGradientDrift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}"
                + "body.mail-app-style{animation:mailGradientDrift 20s ease-in-out infinite;}"
                + "</style></head>"
                + "<body class=\"mail-app-style\" style=\"" + bodyStyle + "\">"
                + "<div style=\"max-width:560px;margin:0 auto;background:#FEFCFA;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(139,135,132,0.12);\">"
                + (innerContent != null ? innerContent : "")
                + "</div></body></html>";
    }

    /** 将纯文本转为 HTML 段落（用于原 sendTextMail 改为 HTML 时） */
    public static String textToHtmlParagraphs(String text) {
        if (text == null || text.isBlank()) return "";
        String escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br>");
        return "<p style=\"margin:0 0 12px 0;color:#3D3B39;\">" + escaped + "</p>";
    }

}

