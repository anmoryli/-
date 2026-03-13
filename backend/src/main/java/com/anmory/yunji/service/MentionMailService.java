package com.anmory.yunji.service;

/**
 * 记录中提及家庭成员时发送邮件通知
 */
public interface MentionMailService {

    /**
     * 检测记录内容中提及的家庭成员，并异步发送邮件通知
     *
     * @param recordOwnerId 记录创建者 userId
     * @param memoId        记录 ID
     * @param recordType    记录类型 text/photo
     * @param title         记录标题
     * @param content       文字内容或照片描述，用于检测提及
     */
    void notifyMentionedMembersAsync(Integer recordOwnerId, Integer memoId, String recordType, String title, String content);

    /**
     * 孕妇有新记录时：若有配偶则给配偶发邮件；若无配偶则给孕妇发站内提醒「邀请配偶加入后可同步记录」
     */
    void notifySpouseNewRecordAsync(Integer recordOwnerId, Integer memoId, String recordType, String title, String contentSnippet);
}
