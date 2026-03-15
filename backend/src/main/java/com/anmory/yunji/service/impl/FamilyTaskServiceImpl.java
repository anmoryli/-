package com.anmory.yunji.service.impl;

import com.anmory.yunji.common.ErrorCode;
import com.anmory.yunji.common.RagService;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.entity.FamilyMember;
import com.anmory.yunji.entity.FamilyTask;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.mapper.FamilyTaskMapper;
import com.anmory.yunji.mapper.FamilyTaskWeekSentMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.FamilyTaskService;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserNotificationService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyTaskServiceImpl implements FamilyTaskService {

    private final FamilyTaskMapper familyTaskMapper;
    private final FamilyTaskWeekSentMapper familyTaskWeekSentMapper;
    private final FamilyService familyService;
    private final UserNotificationService userNotificationService;
    private final UserService userService;
    private final FamilyMemberMapper familyMemberMapper;
    private final MailService mailService;
    private final PromptService promptService;
    private final OpenAiChatModel openAiChatModel;
    private final ObjectMapper objectMapper;
    private final RagService ragService;

    @Override
    public List<FamilyTask> listByAssignee(Integer userId) {
        if (userId == null) return List.of();
        return familyTaskMapper.selectByAssignee(userId);
    }

    @Override
    public List<Map<String, Object>> listByAssigneeWithMeta(Integer userId) {
        List<FamilyTask> list = listByAssignee(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FamilyTask t : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("familyId", t.getFamilyId());
            m.put("assigneeUserId", t.getAssigneeUserId());
            m.put("title", t.getTitle());
            m.put("description", t.getDescription());
            m.put("taskType", t.getTaskType());
            m.put("pregnancyWeek", t.getPregnancyWeek());
            m.put("dueDate", t.getDueDate());
            m.put("status", t.getStatus());
            m.put("completedAt", t.getCompletedAt());
            m.put("createdAt", t.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> listByFamilyId(Integer familyId, Integer requestUserId) {
        if (familyId == null || requestUserId == null) return List.of();
        if (!familyService.isFamilyMember(requestUserId, familyId)) return List.of();
        List<FamilyTask> list = familyTaskMapper.selectByFamilyId(familyId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FamilyTask t : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("familyId", t.getFamilyId());
            m.put("assigneeUserId", t.getAssigneeUserId());
            m.put("title", t.getTitle());
            m.put("description", t.getDescription());
            m.put("taskType", t.getTaskType());
            m.put("pregnancyWeek", t.getPregnancyWeek());
            m.put("dueDate", t.getDueDate());
            m.put("status", t.getStatus());
            m.put("completedAt", t.getCompletedAt());
            m.put("createdAt", t.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FamilyTask completeTask(Integer userId, Integer taskId) {
        if (taskId == null || userId == null) throw new BusinessException("参数无效");
        FamilyTask t = familyTaskMapper.selectById(taskId);
        if (t == null) throw new BusinessException("任务不存在");
        if (!t.getAssigneeUserId().equals(userId)) throw new BusinessException("无权限完成此任务");
        if ("completed".equals(t.getStatus())) return t;
        familyTaskMapper.complete(taskId, LocalDateTime.now());
        t.setStatus("completed");
        t.setCompletedAt(LocalDateTime.now());
        try {
            Family family = familyService.getMyFamily(userId);
            if (family != null && family.getCreatorUserId() != null && !family.getCreatorUserId().equals(userId)) {
                Integer creatorUserId = family.getCreatorUserId();
                String title = "爸爸完成了一条小任务";
                String body = (t.getTitle() != null && !t.getTitle().isBlank())
                        ? "「" + t.getTitle() + "」已完成，快去夸夸他吧～"
                        : "快去夸夸他吧～";
                userNotificationService.notifySystem(creatorUserId, title, body);
                User mom = userService.getById(creatorUserId);
                if (mom != null && mom.getEmail() != null && !mom.getEmail().isBlank()) {
                    String mailBody = String.format(
                            "你好，%s\n\n老公完成了「%s」任务，快去夸夸他吧～\n\n—— 孕期宝 · 爸爸成长营",
                            mom.getUsername(),
                            t.getTitle() != null ? t.getTitle() : "小任务"
                    );
                    String htmlBody = MailServiceImpl.wrapHtmlBodyWithStyle(MailServiceImpl.textToHtmlParagraphs(mailBody));
                    mailService.sendHtmlMail(mom.getEmail(), "爸爸完成了一条小任务", htmlBody);
                    log.info("[爸爸成长营] 已向妈妈发送完成任务通知邮件 creatorUserId={}", creatorUserId);
                }
            }
        } catch (Exception e) {
            log.warn("[爸爸成长营] 完成任务通知妈妈失败 taskId={}", taskId, e);
        }
        return t;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FamilyTask createTask(Integer familyId, Integer assigneeUserId, String title, String description, String taskType) {
        if (familyId == null || assigneeUserId == null || title == null || title.isBlank()) {
            throw new BusinessException("家庭、执行人和标题必填");
        }
        FamilyTask t = new FamilyTask();
        t.setFamilyId(familyId);
        t.setAssigneeUserId(assigneeUserId);
        t.setTitle(title.trim());
        t.setDescription(description != null ? description.trim() : null);
        t.setTaskType(taskType != null && !taskType.isBlank() ? taskType : "routine");
        t.setStatus("pending");
        familyTaskMapper.insert(t);
        userNotificationService.notifyTaskAssigned(assigneeUserId, t.getId(), "新任务：" + t.getTitle(), t.getDescription());
        User assignee = userService.getById(assigneeUserId);
        if (assignee != null && assignee.getEmail() != null && !assignee.getEmail().isBlank()) {
            try {
                String subject = "孕期宝 · 爸爸成长营：新任务提醒";
                String body = String.format(
                    "你好，%s\n\n你在「爸爸成长营」收到新任务：\n\n【%s】\n%s\n\n请打开孕期宝 App，在「我的」→「爸爸成长营」中查看并完成。完成小任务，给准妈妈更多陪伴与支持。",
                    assignee.getUsername(),
                    t.getTitle(),
                    t.getDescription() != null ? t.getDescription() : ""
                );
                String htmlBody = MailServiceImpl.wrapHtmlBodyWithStyle(MailServiceImpl.textToHtmlParagraphs(body));
                mailService.sendHtmlMail(assignee.getEmail(), subject, htmlBody);
                log.info("[爸爸成长营] 已向配偶发送任务提醒邮件 assigneeUserId={} taskId={}", assigneeUserId, t.getId());
            } catch (Exception e) {
                log.warn("[爸爸成长营] 任务提醒邮件发送失败 assigneeUserId={}", assigneeUserId, e);
            }
        }
        return t;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<FamilyTask> generateTasksForWeek(Integer userId) {
        Family family = familyService.getMyFamily(userId);
        if (family == null) throw new BusinessException("您还未创建或加入家庭");
        Integer creatorId = family.getCreatorUserId();
        User creator = userService.getById(creatorId);
        int weekNum = 0;
        if (creator != null && creator.getLastMenstrualDate() != null) {
            String w = PregnancyWeekUtil.calculatePregnancyWeek(creator.getLastMenstrualDate());
            try {
                String num = w.replaceAll("\\D", "").replaceFirst("^0+", "").trim();
                weekNum = num.isEmpty() ? 0 : Math.min(52, Integer.parseInt(num));
            } catch (NumberFormatException ignored) {}
        }
        if (familyTaskWeekSentMapper.existsByFamilyAndWeek(family.getFamilyId(), weekNum) != null) {
            throw new BusinessException(ErrorCode.CONFLICT.code(), ErrorCode.CONFLICT.key(),
                    "本周已发送过，如需继续添加请到爸爸成长营添加");
        }
        String recentSummary = "";
        try {
            String rag = ragService.getRelevant("近期记录 孕周 产检 陪伴", creatorId, true, 5);
            if (rag != null && !rag.isBlank() && !rag.contains("暂时不可用") && !rag.contains("异常")) {
                recentSummary = rag.length() > 400 ? rag.substring(0, 400) : rag;
            }
        } catch (Exception e) {
            log.debug("RAG 检索失败，继续生成任务", e);
        }
        if (recentSummary.isEmpty()) recentSummary = "暂无近期记录";
        List<FamilyTask> existing = familyTaskMapper.selectByFamilyId(family.getFamilyId());
        String existingTasks = existing.isEmpty() ? "无" : existing.stream()
                .map(t -> t.getTitle() + (t.getDescription() != null ? "：" + t.getDescription() : ""))
                .reduce((a, b) -> a + "；" + b).orElse("无");
        String weekStr = weekNum > 0 ? weekNum + "周" : "未知";
        String promptStr = promptService.getUserPrompt("family_task_generate", "default",
                Map.of("week", weekStr, "recentSummary", recentSummary, "existingTasks", existingTasks));
        if (promptStr == null || promptStr.isBlank()) {
            promptStr = "当前孕周：" + weekStr + "。近期记录摘要：" + recentSummary + "。已有任务摘要：" + existingTasks
                    + "。请生成 3～5 条本周任务建议，输出 JSON 数组：[{\"title\":\"...\",\"description\":\"...\"}]";
        }
        List<Map<String, String>> suggestions;
        try {
            String out = ChatClient.builder(openAiChatModel).build().prompt().user(promptStr).call().content();
            if (out == null || out.isBlank()) suggestions = List.of();
            else suggestions = parseTaskSuggestions(out);
        } catch (Exception e) {
            log.warn("AI 生成本周任务失败，使用默认两条", e);
            suggestions = List.of(
                    Map.of("title", "本周陪同产检", "description", weekNum > 0 ? "孕" + weekNum + "周，请陪妈妈产检，给予支持。" : "请陪妈妈产检，给予支持。"),
                    Map.of("title", "每日一个拥抱", "description", "给准妈妈一个拥抱，增进感情。")
            );
        }
        List<FamilyMember> members = familyMemberMapper.findByFamilyId(family.getFamilyId());
        List<FamilyTask> created = new ArrayList<>();
        for (FamilyMember m : members != null ? members : List.<FamilyMember>of()) {
            if (m.getUserId().equals(creatorId)) continue;
            if (!Boolean.TRUE.equals(m.getIsSpouse())) continue;
            for (Map<String, String> sug : suggestions) {
                String title = sug.getOrDefault("title", "").trim();
                if (title.isEmpty()) continue;
                if (title.length() > 15) title = title.substring(0, 15);
                String desc = sug.getOrDefault("description", "").trim();
                String taskType = title.contains("拥抱") || title.contains("陪伴") ? "emotion" : "routine";
                created.add(createTask(family.getFamilyId(), m.getUserId(), title, desc, taskType));
            }
        }
        if (!created.isEmpty()) {
            familyTaskWeekSentMapper.insert(family.getFamilyId(), weekNum);
        }
        return created;
    }

    private List<Map<String, String>> parseTaskSuggestions(String out) {
        String json = out.trim();
        if (json.startsWith("```")) {
            int first = json.indexOf('\n');
            int last = json.lastIndexOf("```");
            if (first >= 0 && last > first) json = json.substring(first + 1, last).trim();
        }
        int start = json.indexOf('[');
        int end = json.lastIndexOf(']');
        if (start >= 0 && end > start) json = json.substring(start, end + 1);
        try {
            JsonNode arr = objectMapper.readTree(json);
            List<Map<String, String>> result = new ArrayList<>();
            for (JsonNode node : arr) {
                String title = node.has("title") ? node.get("title").asText("").trim() : "";
                if (title.isEmpty()) continue;
                if (title.length() > 15) title = title.substring(0, 15);
                String description = node.has("description") ? node.get("description").asText("").trim() : "";
                result.add(Map.of("title", title, "description", description));
            }
            return result;
        } catch (Exception e) {
            log.warn("解析任务 JSON 失败: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<Map<String, String>> suggestTasksForWeek(Integer userId) {
        Family family = familyService.getMyFamily(userId);
        if (family == null) return List.of();
        String weekStr = "未知";
        try {
            User creator = userService.getById(family.getCreatorUserId());
            if (creator != null && creator.getLastMenstrualDate() != null) {
                weekStr = PregnancyWeekUtil.calculatePregnancyWeek(creator.getLastMenstrualDate());
            }
        } catch (Exception e) {
            log.warn("获取创建者孕周失败，使用「未知」继续生成建议: {}", e.getMessage(), e);
        }
        List<FamilyTask> existing = familyTaskMapper.selectByFamilyId(family.getFamilyId());
        String existingTasks = existing.isEmpty() ? "无" : existing.stream()
                .map(t -> t.getTitle() + (t.getDescription() != null ? "：" + t.getDescription() : ""))
                .reduce((a, b) -> a + "；" + b).orElse("无");
        String promptStr = promptService.getUserPrompt("family_task_suggest", "default",
                Map.of("week", weekStr, "existingTasks", existingTasks));
        if (promptStr == null || promptStr.isBlank()) {
            promptStr = "当前孕周：" + weekStr + "。已有任务摘要：" + existingTasks + "。请生成 3～5 条本周任务建议，输出 JSON 数组：[{\"title\":\"...\",\"description\":\"...\"}]";
        }
        try {
            ChatClient client = ChatClient.builder(openAiChatModel).build();
            String out = client.prompt().user(promptStr).call().content();
            if (out == null || out.isBlank()) return List.of();
            String json = out.trim();
            if (json.startsWith("```")) {
                int first = json.indexOf('\n');
                int last = json.lastIndexOf("```");
                if (first >= 0 && last > first) json = json.substring(first + 1, last).trim();
            }
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) json = json.substring(start, end + 1);
            JsonNode arr = objectMapper.readTree(json);
            List<Map<String, String>> result = new ArrayList<>();
            for (JsonNode node : arr) {
                String title = node.has("title") ? node.get("title").asText("").trim() : "";
                if (title.isBlank()) continue;
                if (title.length() > 15) title = title.substring(0, 15);
                String description = node.has("description") ? node.get("description").asText("").trim() : "";
                Map<String, String> m = new HashMap<>();
                m.put("title", title);
                m.put("description", description);
                result.add(m);
            }
            return result;
        } catch (Exception e) {
            log.warn("AI 任务建议解析失败: {}", e.getMessage(), e);
            return List.of();
        }
    }
}
