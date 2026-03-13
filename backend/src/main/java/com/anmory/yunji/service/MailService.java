package com.anmory.yunji.service;

public interface MailService {
    void sendTextMail(String to, String subject, String content);
}

