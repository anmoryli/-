package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.entity.UserNotification;
import com.anmory.yunji.mapper.UserNotificationMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.MentionMailService;
import com.anmory.yunji.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentionMailServiceImpl implements MentionMailService {

    private final FamilyService familyService;
    private final UserService userService;
    private final MailService mailService;
    private final UserNotificationMapper userNotificationMapper;

    @Override
    @Async
    public void notifyMentionedMembersAsync(Integer recordOwnerId, Integer memoId, String recordType, String title, String content) {
        if (content == null || content.isBlank()) return;
        Family family = familyService.getMyFamily(recordOwnerId);
        if (family == null) return;
        List<Map<String, Object>> members = familyService.getFamilyMembers(family.getFamilyId(), recordOwnerId);
        if (members == null || members.isEmpty()) return;

        User owner = userService.getById(recordOwnerId);
        String ownerName = owner != null ? owner.getUsername() : "家人";

        for (Map<String, Object> m : members) {
            Object uidObj = m.get("userId");
            Object usernameObj = m.get("username");
            if (uidObj == null || usernameObj == null) continue;
            int memberUserId = ((Number) uidObj).intValue();
            if (memberUserId == recordOwnerId) continue;
            String username = usernameObj.toString().trim();
            if (username.isEmpty()) continue;

            // 检测提及：@username 或内容包含用户名
            boolean mentioned = content.contains("@" + username) || content.contains(username);
            if (!mentioned) continue;

            User member = userService.getById(memberUserId);
            if (member == null || member.getEmail() == null || member.getEmail().isBlank()) continue;
            if (Boolean.FALSE.equals(member.getEmailEnabled())) continue;

            try {
                String subject = "孕期宝：有人在新记录中提到了你";
                String snippet = content.length() > 100 ? content.substring(0, 100) + "…" : content;
                String typeLabelMention = "text".equals(recordType) ? "文字记录" : "photo".equals(recordType) ? "照片记录" : "记录";
                String htmlBody = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBody(
                    "<p style=\"margin:0 0 12px;font-size:15px;\">你好，" + escapeHtml(username) + "，</p>"
                    + "<p style=\"margin:0 0 12px;font-size:15px;\">" + escapeHtml(ownerName) + " 在孕期记录中提到了你。</p>"
                    + "<p style=\"margin:0 0 8px;font-size:14px;color:#2d2b29;\"><strong>记录类型：</strong>" + typeLabelMention + "</p>"
                    + "<p style=\"margin:0 0 8px;font-size:14px;color:#2d2b29;\"><strong>标题：</strong>" + escapeHtml(title != null ? title : "无标题") + "</p>"
                    + "<p style=\"margin:0 0 16px;font-size:14px;color:#555351;\">内容摘要：" + escapeHtml(snippet) + "</p>"
                    + "<p style=\"margin:0;font-size:14px;color:#555351;\">快去孕期宝看看吧～</p>"
                );
                mailService.sendHtmlMail(member.getEmail(), subject, htmlBody);
                log.info("提及通知邮件已发送 memoId={} toUserId={}", memoId, memberUserId);
            } catch (Exception ex) {
                log.warn("提及通知邮件发送失败 memoId={} toUserId={}", memoId, memberUserId, ex);
            }
        }
    }

    @Override
    @Async
    public void notifySpouseNewRecordAsync(Integer recordOwnerId, Integer memoId, String recordType, String title, String contentSnippet) {
        Family family = familyService.getMyFamily(recordOwnerId);
        if (family == null) return;
        User owner = userService.getById(recordOwnerId);
        String ownerName = owner != null ? owner.getUsername() : "家人";
        String typeLabel = "text".equals(recordType) ? "文字记录" : "voice".equals(recordType) ? "语音记录" : "photo".equals(recordType) ? "照片记录" : "file".equals(recordType) ? "文件记录" : "记录";
        boolean isCreator = family.getCreatorUserId().equals(recordOwnerId);

        if (isCreator) {
            List<Integer> spouseIds = familyService.getSpouseUserIds(recordOwnerId);
            if (!spouseIds.isEmpty()) {
                for (Integer spouseId : spouseIds) {
                    User spouse = userService.getById(spouseId);
                    if (spouse == null || spouse.getEmail() == null || spouse.getEmail().isBlank()) continue;
                    if (Boolean.FALSE.equals(spouse.getEmailEnabled())) continue;
                    try {
                        String subject = "孕期宝：准妈妈有新记录";
                        String snippet = contentSnippet != null && contentSnippet.length() > 80 ? contentSnippet.substring(0, 80) + "…" : (contentSnippet != null ? contentSnippet : "");
                        String htmlBody = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBody(
                            "<p style=\"margin:0 0 12px;font-size:15px;\">你好，" + escapeHtml(spouse.getUsername()) + "，</p>"
                            + "<p style=\"margin:0 0 12px;font-size:15px;\">" + escapeHtml(ownerName) + " 刚刚发布了一条新的孕期" + typeLabel + "。</p>"
                            + "<p style=\"margin:0 0 8px;font-size:14px;color:#2d2b29;\"><strong>标题：</strong>" + escapeHtml(title != null ? title : "无标题") + "</p>"
                            + (snippet.isEmpty() ? "" : "<p style=\"margin:0 0 16px;font-size:14px;color:#555351;\">内容摘要：" + escapeHtml(snippet) + "</p>")
                            + "<p style=\"margin:0;font-size:14px;color:#555351;\">打开孕期宝 App 在「记录」中查看，一起陪伴孕期时光。</p>"
                        );
                        mailService.sendHtmlMail(spouse.getEmail(), subject, htmlBody);
                        log.info("[新记录通知] 已向配偶发邮件 memoId={} spouseUserId={}", memoId, spouseId);
                    } catch (Exception e) {
                        log.warn("[新记录通知] 邮件发送失败 memoId={} spouseUserId={}", memoId, spouseId, e);
                    }
                }
            } else {
                String inviteSpouseTitle = "邀请配偶加入后可同步记录";
                if (userNotificationMapper.countByUserIdAndTypeAndTitle(recordOwnerId, "system", inviteSpouseTitle) == 0) {
                    UserNotification n = new UserNotification();
                    n.setUserId(recordOwnerId);
                    n.setType("system");
                    n.setTitle(inviteSpouseTitle);
                    n.setBody("在「我们的小家」中邀请配偶加入，对方即可在 App 内收到你的新记录提醒。");
                    n.setRelatedTaskId(null);
                    userNotificationMapper.insert(n);
                    log.info("[新记录通知] 无配偶，已向孕妇发站内提醒（仅提醒一次） recordOwnerId={}", recordOwnerId);
                }
            }
        } else {
            User creator = userService.getById(family.getCreatorUserId());
            if (creator != null && creator.getEmail() != null && !creator.getEmail().isBlank()) {
                if (Boolean.FALSE.equals(creator.getEmailEnabled())) return;
                try {
                    String subject = "孕期宝：准爸爸有新记录";
                    String snippet = contentSnippet != null && contentSnippet.length() > 80 ? contentSnippet.substring(0, 80) + "…" : (contentSnippet != null ? contentSnippet : "");
                    String htmlBody = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBody(
                        "<p style=\"margin:0 0 12px;font-size:15px;\">你好，" + escapeHtml(creator.getUsername()) + "，</p>"
                        + "<p style=\"margin:0 0 12px;font-size:15px;\">" + escapeHtml(ownerName) + " 刚刚发布了一条新的孕期" + typeLabel + "。</p>"
                        + "<p style=\"margin:0 0 8px;font-size:14px;color:#2d2b29;\"><strong>标题：</strong>" + escapeHtml(title != null ? title : "无标题") + "</p>"
                        + (snippet.isEmpty() ? "" : "<p style=\"margin:0 0 16px;font-size:14px;color:#555351;\">内容摘要：" + escapeHtml(snippet) + "</p>")
                        + "<p style=\"margin:0;font-size:14px;color:#555351;\">打开孕期宝 App 在「记录」中查看。</p>"
                    );
                    mailService.sendHtmlMail(creator.getEmail(), subject, htmlBody);
                    log.info("[新记录通知] 已向孕妇发邮件（爸爸发记录） memoId={} creatorUserId={}", memoId, family.getCreatorUserId());
                } catch (Exception e) {
                    log.warn("[新记录通知] 邮件发送失败 memoId={} creatorUserId={}", memoId, family.getCreatorUserId(), e);
                }
            }
        }
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
