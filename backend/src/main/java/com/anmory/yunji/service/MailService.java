package com.anmory.yunji.service;

public interface MailService {
    void sendTextMail(String to, String subject, String content);

    /** 发送 HTML 邮件（与 APP 暖色风格一致，内联样式） */
    void sendHtmlMail(String to, String subject, String htmlContent);

    /** 发送 HTML 邮件并附带附件（如 PDF） */
    void sendHtmlMailWithAttachment(String to, String subject, String htmlContent, String attachmentFileName, byte[] attachmentBytes);
}

