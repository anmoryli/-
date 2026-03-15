package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Conversation;
import com.anmory.yunji.entity.Message;
import com.anmory.yunji.entity.Scenario;
import com.anmory.yunji.entity.ScenarioReport;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.ScenarioReportMapper;
import com.anmory.yunji.service.ConversationService;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.MessageService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.ScenarioReportService;
import com.anmory.yunji.service.ScenarioService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScenarioReportServiceImpl implements ScenarioReportService {

    private final ScenarioReportMapper scenarioReportMapper;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final ScenarioService scenarioService;
    private final FamilyService familyService;
    private final UserService userService;
    private final PromptService promptService;
    private final OpenAiChatModel openAiChatModel;

    @Override
    public ScenarioReport create(Integer conversationId, Integer scenarioId, Integer spouseUserId, Integer creatorUserId, String content) {
        ScenarioReport r = new ScenarioReport();
        r.setConversationId(conversationId);
        r.setScenarioId(scenarioId);
        r.setSpouseUserId(spouseUserId);
        r.setCreatorUserId(creatorUserId);
        r.setContent(content);
        scenarioReportMapper.insert(r);
        return r;
    }

    @Override
    public ScenarioReport endAndGenerateReport(Integer userId, Integer conversationId, String reason) {
        log.info("[情景报告] 入口 userId={} conversationId={} reason={}", userId, conversationId, reason);
        Conversation conv = conversationService.getByIdAndUserId(conversationId, userId);
        if (conv == null || conv.getScenarioId() == null) {
            log.warn("[情景报告] 会话不存在或非情景会话 userId={} conversationId={}", userId, conversationId);
            return null;
        }
        if (!familyService.isSpouse(userId)) {
            log.warn("[情景报告] 非配偶用户 userId={}", userId);
            return null;
        }
        com.anmory.yunji.entity.Family family = familyService.getMyFamily(userId);
        if (family == null || family.getCreatorUserId() == null) {
            log.warn("[情景报告] 无家庭或无创建者 userId={}", userId);
            return null;
        }
        Integer creatorUserId = family.getCreatorUserId();
        Scenario scenario = scenarioService.getById(conv.getScenarioId());
        if (scenario == null) {
            log.warn("[情景报告] 情景不存在 scenarioId={}", conv.getScenarioId());
            return null;
        }
        List<Message> history = messageService.getHistory(conversationId);
        if (history == null || history.isEmpty()) {
            log.warn("[情景报告] 无对话历史 conversationId={}", conversationId);
            return null;
        }
        // 安全拼接对话文本（避免 BLOB/null 导致 NPE）
        StringBuilder sb = new StringBuilder();
        for (Message m : history) {
            String part = (m.getContent() != null) ? m.getContent() : "";
            sb.append(Boolean.TRUE.equals(m.getIsAi()) ? "妻子（AI）" : "配偶").append("：").append(part).append("\n\n");
        }
        String conversationText = sb.toString().trim();
        if (conversationText.isEmpty()) {
            log.warn("[情景报告] 对话内容均为空 conversationId={}", conversationId);
            return null;
        }
        log.info("[情景报告] 对话文本已拼接 conversationId={} len={}", conversationId, conversationText.length());
        // 传给 AI 的对话截断，避免超长导致超时/token 超限（兜底仍用全文）
        final int maxLenForAi = 12000;
        String conversationForAi = conversationText.length() > maxLenForAi
                ? conversationText.substring(0, maxLenForAi) + "\n\n...（对话已截断）"
                : conversationText;

        // 先只查是否有模板（不传大段对话），无模板则直接兜底，避免 500
        String systemPromptFromDb = null;
        try {
            systemPromptFromDb = promptService.getSystemPrompt("scenario_report", "default");
            log.info("[情景报告] getSystemPrompt 完成 hasValue={}", systemPromptFromDb != null && !systemPromptFromDb.isBlank());
        } catch (Throwable t) {
            log.error("[情景报告] 读取 system prompt 异常，直接走兜底", t);
        }
        boolean hasTemplate = (systemPromptFromDb != null && !systemPromptFromDb.isBlank()) && (openAiChatModel != null);
        log.info("[情景报告] hasTemplate={} openAiChatModelNull={}", hasTemplate, openAiChatModel == null);

        if (hasTemplate) {
            log.info("[情景报告] 进入 AI 分支 conversationId={}", conversationId);
            try {
                User creator = userService.getById(creatorUserId);
                String week = creator != null && creator.getLastMenstrualDate() != null
                        ? PregnancyWeekUtil.calculatePregnancyWeek(creator.getLastMenstrualDate())
                        : "未知";
                String momName = creator != null && creator.getUsername() != null ? creator.getUsername() : "妻子";
                log.info("[情景报告] creator/week/momName 已取 conversationId={}", conversationId);
                String userPrompt;
                try {
                    String fromDb = promptService.getUserPrompt("scenario_report", "default",
                            Map.of("scenarioTitle", scenario.getTitle(), "conversation", conversationForAi, "week", week, "momName", momName));
                    userPrompt = (fromDb != null && !fromDb.isBlank()) ? fromDb
                            : ("以下是一段情景演绎对话，情景名称：「" + scenario.getTitle() + "」。请根据对话内容生成一份简短的情景报告。\n\n对话内容：\n" + conversationForAi);
                    log.info("[情景报告] getUserPrompt 完成 userPromptLen={}", userPrompt != null ? userPrompt.length() : 0);
                } catch (Throwable t) {
                    log.error("[情景报告] 构建 user prompt 异常，用简短默认", t);
                    userPrompt = "以下是一段情景演绎对话，情景名称：「" + scenario.getTitle() + "」。请生成一份简短的情景报告。";
                }
                final String systemPromptFinal = systemPromptFromDb;
                final String userPromptFinal = userPrompt;
                // 单次调用带 20 秒超时，避免 OpenAI 无响应时请求一直挂起导致前端 500
                final int aiTimeoutSeconds = 20;
                log.info("[情景报告] AI 调用开始 timeout={}s conversationId={}", aiTimeoutSeconds, conversationId);
                try {
                    String content = CompletableFuture.supplyAsync(() ->
                            ChatClient.builder(openAiChatModel)
                                    .defaultSystem(systemPromptFinal)
                                    .build()
                                    .prompt()
                                    .user(userPromptFinal)
                                    .call()
                                    .content()
                    ).get(aiTimeoutSeconds, TimeUnit.SECONDS);
                    log.info("[情景报告] AI 返回 contentNull={} blank={}", content == null, content != null && content.isBlank());
                    if (content != null && !content.isBlank()) {
                        log.info("[情景报告] 准备 create 报告 conversationId={}", conversationId);
                        ScenarioReport report = create(conversationId, conv.getScenarioId(), userId, creatorUserId, content.trim());
                        log.info("[情景报告] create 成功 reportId={}", report != null ? report.getReportId() : null);
                        return report;
                    }
                } catch (TimeoutException e) {
                    log.warn("[情景报告] AI 调用超时 {}s conversationId={} userId={}", aiTimeoutSeconds, conversationId, userId);
                } catch (Throwable e) {
                    log.error("[情景报告] AI 生成失败 conversationId={} userId={} error={}", conversationId, userId, e.getMessage(), e);
                }
                log.info("[情景报告] AI 分支结束，将走兜底 conversationId={}", conversationId);
            } catch (Throwable t) {
                log.error("[情景报告] 生成过程异常，走兜底 conversationId={} userId={}", conversationId, userId, t);
            }
        } else {
            log.info("[情景报告] 无模板或未配置 AI，直接走兜底 conversationId={} userId={}", conversationId, userId);
        }
        // 重试均失败或任何异常：用对话记录导出作为报告内容兜底，仍返回报告不返回 null
        String fallbackContent = "## 情景：「" + scenario.getTitle() + "」\n\n### 对话记录\n\n" + conversationText + "\n\n---\n*（AI 报告生成暂时不可用，以上为对话记录导出。）*";
        log.info("[情景报告] 使用对话记录兜底 conversationId={} userId={}", conversationId, userId);
        try {
            log.info("[情景报告] 兜底 create 入库前 conversationId={}", conversationId);
            ScenarioReport report = create(conversationId, conv.getScenarioId(), userId, creatorUserId, fallbackContent);
            log.info("[情景报告] 兜底 create 成功 reportId={}", report != null ? report.getReportId() : null);
            return report;
        } catch (Throwable t) {
            log.error("[情景报告] 兜底报告入库失败 conversationId={} userId={}", conversationId, userId, t);
            return null;
        }
    }

    @Override
    public List<ScenarioReport> listBySpouseUserId(Integer spouseUserId) {
        if (spouseUserId == null) return List.of();
        return scenarioReportMapper.selectBySpouseUserId(spouseUserId);
    }

    @Override
    public ScenarioReport getByIdAndSpouse(Integer reportId, Integer spouseUserId) {
        if (reportId == null || spouseUserId == null) return null;
        return scenarioReportMapper.selectByIdAndSpouse(reportId, spouseUserId);
    }
}
