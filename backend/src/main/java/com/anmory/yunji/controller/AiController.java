package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.common.ErrorCode;
import com.anmory.yunji.entity.Conversation;
import com.anmory.yunji.entity.Message;
import com.anmory.yunji.entity.AiGenerationPost;
import com.anmory.yunji.entity.AiTemplate;
import com.anmory.yunji.entity.AiGenerationPostLike;
import com.anmory.yunji.entity.AiGenerationPostComment;
import com.anmory.yunji.entity.AiGenerationPostCommentLike;
import com.anmory.yunji.entity.ScheduledOperation;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.AiGenerationPostMapper;
import com.anmory.yunji.mapper.ScheduledOperationMapper;
import com.anmory.yunji.mapper.AiTemplateMapper;
import com.anmory.yunji.mapper.AiGenerationPostLikeMapper;
import com.anmory.yunji.mapper.AiGenerationPostCommentMapper;
import com.anmory.yunji.mapper.AiGenerationPostCommentLikeMapper;
import com.anmory.yunji.mapper.FamilyMemberMapper;
import com.anmory.yunji.entity.Family;
import com.anmory.yunji.service.ConversationService;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.MemoService;
import com.anmory.yunji.service.MessageService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.ScheduleDraftStore;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.common.RagService;
import com.anmory.yunji.utils.AliOssUtil;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import com.anmory.yunji.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final UserService userService;
    private final MemoService memoService;
    private final OpenAiChatModel openAiChatModel;
    private final AliOssUtil aliOssUtil;
    private final ObjectMapper objectMapper;
    private final AiTemplateMapper aiTemplateMapper;
    private final AiGenerationPostMapper aiGenerationPostMapper;
    private final AiGenerationPostLikeMapper aiGenerationPostLikeMapper;
    private final AiGenerationPostCommentMapper aiGenerationPostCommentMapper;
    private final AiGenerationPostCommentLikeMapper aiGenerationPostCommentLikeMapper;
    private final PromptService promptService;
    private final FamilyMemberMapper familyMemberMapper;
    private final FamilyService familyService;
    private final MailService mailService;
    private final ScheduledOperationMapper scheduledOperationMapper;
    private final ScheduleDraftStore scheduleDraftStore;

    @Value("${spring.ai.openai.base-url}")
    private String aiBaseUrl;

    @Value("${spring.ai.openai.api-key}")
    private String aiApiKey;

    private static final Pattern DATA_IMAGE_PATTERN = Pattern.compile("data:image/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)");
    private static final String MODEL_TEXT_CHAT = "gpt-5.2";
    private static final String MODEL_IMAGE = "gemini-2.5-flash-image";

    /** 配偶提及关键词（用户输入包含则触发邮件通知），与 FamilyServiceImpl.SPOUSE_KEYWORDS 保持一致 */
    private static final String[] SPOUSE_MENTION_KEYWORDS = {"老公", "老婆", "丈夫", "配偶", "妻子"};

    private boolean mentionsSpouse(String text) {
        if (text == null || text.isBlank()) return false;
        String t = text.trim();
        for (String kw : SPOUSE_MENTION_KEYWORDS) {
            if (t.contains(kw)) return true;
        }
        return false;
    }

    private final RagService ragService;

    @PostMapping("/createConversation")
    public Result<Conversation> createConversation(@RequestParam Integer userId,
                                                   @RequestParam(required = false) String title) {
        Conversation conv = conversationService.create(userId, title != null ? title : "新对话");
        return Result.success(conv);
    }

    @GetMapping("/conversation/list")
    public Result<List<Conversation>> listConversations(@RequestParam Integer userId) {
        List<Conversation> list = conversationService.listByUserId(userId);
        return Result.success(list);
    }

    @DeleteMapping("/deleteConversation")
    public Result<Boolean> deleteConversation(@RequestParam Integer userId,
                                                  @RequestParam Integer conversationId) {
        boolean ok = conversationService.delete(userId, conversationId);
        return Result.success(ok);
    }

    @GetMapping("/conversation/history")
    public Result<List<Message>> getHistory(@RequestParam Integer userId,
                                          @RequestParam Integer conversationId) {
        Conversation conv = conversationService.getByIdAndUserId(conversationId, userId);
        if (conv == null) {
            return Result.error(403, ErrorCode.FORBIDDEN.key(), "无权限或会话不存在");
        }
        List<Message> history = messageService.getHistory(conversationId);
        return Result.success(history);
    }

    /**
     * 每日/开场暖心语：根据用户孕周与当前日期返回一句鼓励或祝福，用于聊天页空状态展示。
     */
    @GetMapping("/daily-warm")
    public Result<String> dailyWarm(@RequestParam Integer userId) {
        User user = userService.getById(userId);
        if (user == null) {
            return Result.success("今天也要好好照顾自己呀～");
        }
        String week = user.getLastMenstrualDate() != null
                ? PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate())
                : "未知";
        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String userPrompt = promptService.getUserPrompt("daily_warm_message", "default",
                Map.of("week", week, "date", dateStr));
        if (userPrompt == null || userPrompt.isBlank()) {
            return Result.success("今天也要好好照顾自己呀～");
        }
        try {
            String systemPrompt = promptService.getSystemPrompt("daily_warm_message", "default");
            String sentence = ChatClient.builder(openAiChatModel)
                    .defaultSystem(systemPrompt != null ? systemPrompt : "你是孕期暖心语助手，输出一句简短温暖的鼓励，不要换行、不要引号。")
                    .build()
                    .prompt()
                    .user(userPrompt)
                    .call()
                    .content();
            if (sentence != null && !sentence.isBlank()) {
                return Result.success(sentence.trim());
            }
        } catch (Exception e) {
            log.warn("[daily-warm] 生成失败 userId={}", userId, e);
        }
        return Result.success("今天也要好好照顾自己呀～");
    }

    /**
     * 流式对话：先保存用户消息，再流式返回 AI 回复（UTF-8），最后保存 AI 消息。
     * Content-Type: text/event-stream; charset=UTF-8 避免中文乱码。
     */
    @PostMapping(value = "/chat-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestParam(value = "userId", required = false) Integer userIdParam,
                                 @RequestParam Integer conversationId,
                                 @RequestParam(required = false) String question,
                                 @RequestParam(value = "images", required = false) List<MultipartFile> images,
                                 @RequestParam(value = "publishToCommunity", required = false) String publishToCommunityParam) {

        // 代理或 FormData 有时会丢失 userId，从会话反查一次
        Integer userIdResolved = userIdParam;
        if (userIdResolved == null && conversationId != null) {
            Conversation byId = conversationService.getById(conversationId);
            if (byId != null && byId.getUserId() != null) {
                userIdResolved = byId.getUserId();
                log.info("[流式] 请求未带 userId，已从会话 conversationId={} 反查得到 userId={}", conversationId, userIdResolved);
            }
        }
        if (userIdResolved == null) {
            log.warn("[流式] 缺少 userId 且无法从 conversationId={} 反查", conversationId);
            SseEmitter emitter = new SseEmitter(1000L);
            try {
                emitter.send(SseEmitter.event().data("错误：缺少用户标识，请重新发送"));
            } catch (IOException e) {
                log.warn("[流式] 发送错误事件失败", e);
            }
            emitter.completeWithError(new IllegalArgumentException("缺少 userId"));
            return emitter;
        }
        final Integer userId = userIdResolved;

        // 显式解析：仅当参数为 "true" 时才发布，避免 FormData 缺失/解析异常导致误发布
        boolean publishToCommunity = "true".equalsIgnoreCase(publishToCommunityParam != null ? publishToCommunityParam.trim() : "");
        String safeQuestion = question == null ? "" : question.trim();
        log.info("[流式] 请求开始 userId={} conversationId={} questionLen={} questionPreview={} hasImages={} publishToCommunity={}",
                userId, conversationId, safeQuestion.length(),
                safeQuestion.length() > 80 ? safeQuestion.substring(0, 80) + "…" : safeQuestion,
                images != null && !images.isEmpty(), publishToCommunity);
        boolean hasImages = images != null && !images.isEmpty();

        Conversation conv = conversationService.getByIdAndUserId(conversationId, userId);
        if (conv == null) {
            log.warn("[流式] 会话不存在或无权限 userId={} conversationId={}", userId, conversationId);
            SseEmitter emitter = new SseEmitter(1000L);
            try {
                emitter.send(SseEmitter.event().data("错误：会话不存在或无权限"));
            } catch (IOException e) {
                log.warn("[流式] 发送错误事件失败", e);
            }
            emitter.completeWithError(new RuntimeException("会话不存在或无权限"));
            return emitter;
        }

        List<String> imageUrls = uploadUserImages(userId, images);
        String userMessageForHistory = buildUserMessageContent(safeQuestion, imageUrls);
        messageService.save(conversationId, userId, userMessageForHistory, false);

        SseEmitter emitter = new SseEmitter(60_000L);
        ChatIntent intent = detectIntent(safeQuestion, hasImages);
        log.info("[多模态] 意图识别 userId={} conversationId={} intent={}", userId, conversationId, intent);

        try {
            if (!hasImages && intent == ChatIntent.TEXT_TO_IMAGE) {
                String imageUrl = generateImageFromText(userId, safeQuestion);
                String answer = "这是我为你生成的图片：\n\n![AI生成图片](" + imageUrl + ")";
                messageService.save(conversationId, userId, answer, true);
                emitter.send(SseEmitter.event().data(answer));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
                return emitter;
            }

            if (hasImages && intent == ChatIntent.IMAGE_TO_IMAGE) {
                String imageUrl = generateImageFromImage(userId, safeQuestion, imageUrls.get(0));
                String answer = "这是我基于你上传图片生成的变体：\n\n![AI生成图片](" + imageUrl + ")";
                boolean insertPost = publishToCommunity;
                if (publishToCommunity) {
                    User currentUser = userService.getById(userId);
                    if (Boolean.TRUE.equals(currentUser != null ? currentUser.getIsSpouse() : null)) {
                        answer += "\n\n（配偶不可公开到社区，作品已保存为仅自己可见。）";
                        publishToCommunity = false;
                    }
                }
                if (insertPost) {
                    AiGenerationPost post = new AiGenerationPost();
                    post.setUserId(userId);
                    post.setTemplateId(null);
                    post.setInputImageUrl(imageUrls.get(0));
                    post.setOutputImageUrl(imageUrl);
                    post.setPromptText(safeQuestion == null || safeQuestion.isBlank() ? "图生图生成" : safeQuestion);
                    post.setIsPublic(publishToCommunity);
                    aiGenerationPostMapper.insert(post);
                }
                messageService.save(conversationId, userId, answer, true);
                emitter.send(SseEmitter.event().data(answer));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
                return emitter;
            }
        } catch (Exception e) {
            log.error("[多模态] 图片生成失败 userId={} conversationId={}", userId, conversationId, e);
            try {
                emitter.send(SseEmitter.event().data("图片生成失败，请稍后重试。"));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (IOException ignored) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        if (!hasImages && intent == ChatIntent.REMINDER) {
            try {
                String stateJson = scheduleDraftStore.get(conversationId);
                String time = "", place = "", what = "", notes = "";
                int rounds = 0;
                if (stateJson != null && !stateJson.isBlank()) {
                    try {
                        JsonNode s = objectMapper.readTree(stateJson);
                        time = s.has("time") && !s.get("time").isNull() ? s.get("time").asText("") : "";
                        place = s.has("place") && !s.get("place").isNull() ? s.get("place").asText("") : "";
                        what = s.has("what") && !s.get("what").isNull() ? s.get("what").asText("") : "";
                        notes = s.has("notes") && !s.get("notes").isNull() ? s.get("notes").asText("") : "";
                        rounds = s.has("rounds") && !s.get("rounds").isNull() ? s.get("rounds").asInt(0) : 0;
                    } catch (Exception ignored) {}
                }
                String conversationSnippet = buildConversationMemory(conversationId);
                if (conversationSnippet != null && conversationSnippet.length() > 1200) {
                    conversationSnippet = conversationSnippet.substring(conversationSnippet.length() - 1200);
                }
                String convForPrompt = (conversationSnippet != null && !conversationSnippet.isBlank()) ? conversationSnippet : "（无）";
                String collectPrompt = promptService.getUserPrompt("schedule_task_collect", "default",
                        Map.of("time", time, "place", place, "what", what, "notes", notes, "message", safeQuestion, "conversation", convForPrompt));
                if (collectPrompt == null || collectPrompt.isBlank()) {
                    collectPrompt = "本对话近期记录：\n" + convForPrompt + "\n当前已有状态：time=" + time + ", place=" + place + ", what=" + what + ", notes=" + notes + "。用户最新说：" + safeQuestion + "\n\n输出 JSON：{\"complete\":true或false,\"scheduleType\":\"once或daily\",\"time\":\"\",\"runTime\":\"\",\"place\":\"\",\"what\":\"\",\"notes\":\"\",\"replyToUser\":\"\"}";
                }
                String jsonOut = ChatClient.builder(openAiChatModel).build().prompt().user(collectPrompt).call().content();
                if (jsonOut != null && !jsonOut.isBlank()) {
                    int start = jsonOut.indexOf('{');
                    int end = jsonOut.lastIndexOf('}');
                    if (start >= 0 && end > start) jsonOut = jsonOut.substring(start, end + 1);
                    JsonNode node = objectMapper.readTree(jsonOut);
                    boolean complete = node.has("complete") && node.get("complete").asBoolean(false);
                    String newTime = node.has("time") && !node.get("time").isNull() ? node.get("time").asText("").trim() : "";
                    String runTimeStr = node.has("runTime") && !node.get("runTime").isNull() ? node.get("runTime").asText("").trim() : "";
                    String newPlace = node.has("place") && !node.get("place").isNull() ? node.get("place").asText("").trim() : "";
                    String newWhat = node.has("what") && !node.get("what").isNull() ? node.get("what").asText("").trim() : "";
                    String newNotes = node.has("notes") && !node.get("notes").isNull() ? node.get("notes").asText("").trim() : "";
                    String replyToUser = node.has("replyToUser") && !node.get("replyToUser").isNull() ? node.get("replyToUser").asText("").trim() : "";
                    String scheduleTypeFromNode = node.has("scheduleType") && !node.get("scheduleType").isNull() ? node.get("scheduleType").asText("once").trim() : "once";

                    String effectiveTime = newTime != null && !newTime.isBlank() ? newTime : time;
                    String effectivePlace = newPlace != null && !newPlace.isBlank() ? newPlace : place;
                    String effectiveWhat = newWhat != null && !newWhat.isBlank() ? newWhat : what;
                    String effectiveNotes = newNotes != null && !newNotes.isBlank() ? newNotes : notes;

                    boolean hasTime = effectiveTime != null && !effectiveTime.isBlank();
                    boolean hasPlace = effectivePlace != null && !effectivePlace.isBlank();
                    boolean hasWhat = effectiveWhat != null && !effectiveWhat.isBlank();
                    if (rounds >= 1 && hasTime && hasPlace && hasWhat) {
                        complete = true;
                    }
                    if (rounds >= 2) {
                        complete = true;
                        if (!hasTime) effectiveTime = LocalDate.now().plusDays(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 09:00";
                        if (!hasPlace) effectivePlace = "待定";
                        if (!hasWhat) effectiveWhat = safeQuestion != null && !safeQuestion.isBlank() ? safeQuestion : "待办";
                    }
                    if (complete && (!hasTime || !hasPlace || !hasWhat) && rounds < 2) {
                        complete = false;
                        replyToUser = "还差一点：几点？去哪儿？做啥？一句说完就行～";
                    }

                    if (complete) {
                        LocalDateTime nextRunAt = null;
                        LocalDateTime runAt = null;
                        String scheduleType = "once";
                        if ("daily".equalsIgnoreCase(scheduleTypeFromNode) && runTimeStr != null && !runTimeStr.isBlank()) {
                            try {
                                LocalTime t = LocalTime.parse(runTimeStr, DateTimeFormatter.ofPattern("HH:mm"));
                                nextRunAt = LocalDate.now().atTime(t);
                                if (nextRunAt.isBefore(LocalDateTime.now())) nextRunAt = nextRunAt.plusDays(1);
                                scheduleType = "daily";
                            } catch (Exception ignored) {}
                        }
                        if (nextRunAt == null && effectiveTime != null && !effectiveTime.isBlank()) {
                            boolean parsed = false;
                            try {
                                runAt = LocalDateTime.parse(effectiveTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                                nextRunAt = runAt;
                                parsed = true;
                            } catch (Exception e1) {
                                try {
                                    runAt = LocalDate.parse(effectiveTime, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atTime(9, 0);
                                    nextRunAt = runAt;
                                    parsed = true;
                                } catch (Exception e2) { /* fall through */ }
                            }
                            if (!parsed) {
                                String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                                String combined = (effectiveTime + " " + (effectivePlace != null ? effectivePlace : "") + " " + (effectiveWhat != null ? effectiveWhat : "")).trim();
                                String parsePrompt = promptService.getUserPrompt("schedule_parse", "default", Map.of("question", combined, "now", nowStr));
                                if (parsePrompt == null || parsePrompt.isBlank()) parsePrompt = "当前北京时间：" + nowStr + "\n用户说：" + combined + "\n\n输出 JSON：{\"scheduleType\":\"once\",\"runTime\":\"\",\"runAt\":\"yyyy-MM-dd HH:mm\",\"content\":\"\"}";
                                try {
                                    String parseOut = ChatClient.builder(openAiChatModel).build().prompt().user(parsePrompt).call().content();
                                    if (parseOut != null && !parseOut.isBlank()) {
                                        int ps = parseOut.indexOf('{'), pe = parseOut.lastIndexOf('}');
                                        if (ps >= 0 && pe > ps) parseOut = parseOut.substring(ps, pe + 1);
                                        JsonNode pNode = objectMapper.readTree(parseOut);
                                        String runAtStr2 = pNode.has("runAt") && !pNode.get("runAt").isNull() ? pNode.get("runAt").asText("").trim() : "";
                                        if (runAtStr2.isBlank()) {
                                            parsePrompt = promptService.getUserPrompt("schedule_parse", "default", Map.of("question", effectiveTime, "now", nowStr));
                                            if (parsePrompt != null && !parsePrompt.isBlank()) {
                                                String parseOut2 = ChatClient.builder(openAiChatModel).build().prompt().user(parsePrompt).call().content();
                                                if (parseOut2 != null && !parseOut2.isBlank()) {
                                                    int p2 = parseOut2.indexOf('{'), q2 = parseOut2.lastIndexOf('}');
                                                    if (p2 >= 0 && q2 > p2) {
                                                        JsonNode pNode2 = objectMapper.readTree(parseOut2.substring(p2, q2 + 1));
                                                        runAtStr2 = pNode2.has("runAt") && !pNode2.get("runAt").isNull() ? pNode2.get("runAt").asText("").trim() : "";
                                                    }
                                                }
                                            }
                                        }
                                        if (!runAtStr2.isBlank()) {
                                            try {
                                                runAt = LocalDateTime.parse(runAtStr2, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                                                nextRunAt = runAt;
                                            } catch (Exception e3) {
                                                try {
                                                    runAt = LocalDate.parse(runAtStr2, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atTime(9, 0);
                                                    nextRunAt = runAt;
                                                } catch (Exception ignored) {}
                                            }
                                        }
                                    }
                                } catch (Exception e3) {
                                    log.warn("[REMINDER] schedule_parse 解析失败 combined={}", combined, e3);
                                }
                            }
                        }
                        if (nextRunAt != null) {
                            StringBuilder contentSb = new StringBuilder();
                            if (effectiveWhat != null && !effectiveWhat.isBlank()) contentSb.append(effectiveWhat);
                            if (effectivePlace != null && !effectivePlace.isBlank()) contentSb.append(contentSb.length() > 0 ? " @ " : "").append(effectivePlace);
                            if (effectiveNotes != null && !effectiveNotes.isBlank()) contentSb.append(contentSb.length() > 0 ? " " : "").append(effectiveNotes);
                            String content = contentSb.length() > 0 ? contentSb.toString() : safeQuestion;
                            if (content.length() > 500) content = content.substring(0, 500);

                            ScheduledOperation op = new ScheduledOperation();
                            op.setUserId(userId);
                            op.setContent(content);
                            op.setScheduleType(scheduleType);
                            op.setRunAt("once".equals(scheduleType) ? runAt : null);
                            op.setRunTime("daily".equals(scheduleType) ? runTimeStr : null);
                            op.setNextRunAt(nextRunAt);
                            op.setStatus("pending");
                            scheduledOperationMapper.insert(op);
                            scheduleDraftStore.remove(conversationId);

                            boolean verified = (op.getId() != null && scheduledOperationMapper.selectById(op.getId()) != null);
                            String reply = verified
                                    ? (replyToUser != null && !replyToUser.isBlank() ? replyToUser : "已添加提醒：「" + content + "」。" + ("daily".equals(scheduleType) ? "将每天 " + runTimeStr + " 提醒你。" : "将在 " + nextRunAt.format(DateTimeFormatter.ofPattern("M月d日 HH:mm")) + " 提醒你。"))
                                    : "提醒可能未成功保存，请稍后再试或重新说一遍。";
                            if (verified) {
                                String tableTime = nextRunAt != null ? nextRunAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : (effectiveTime != null ? effectiveTime : "");
                                reply = reply + "\n\n| 时间 | 地点 | 做什么 | 备注 | 类型 |\n|--|--|--|--|--|\n| " + tableTime + " | " + (effectivePlace != null ? effectivePlace : "-") + " | " + (effectiveWhat != null ? effectiveWhat : "-") + " | " + (effectiveNotes != null && !effectiveNotes.isBlank() ? effectiveNotes : "-") + " | " + scheduleType + " |";
                            }
                            messageService.save(conversationId, userId, safeQuestion, false, true);
                            messageService.save(conversationId, userId, reply, true);
                            emitter.send(SseEmitter.event().data(reply));
                            emitter.send(SseEmitter.event().name("done").data(""));
                            emitter.complete();
                            return emitter;
                        }
                    }

                    if (!complete) {
                        ObjectNode newState = objectMapper.createObjectNode();
                        newState.put("time", effectiveTime != null ? effectiveTime : "");
                        newState.put("place", effectivePlace != null ? effectivePlace : "");
                        newState.put("what", effectiveWhat != null ? effectiveWhat : "");
                        newState.put("notes", effectiveNotes != null ? effectiveNotes : "");
                        newState.put("rounds", rounds + 1);
                        scheduleDraftStore.set(conversationId, objectMapper.writeValueAsString(newState));

                        String reply = replyToUser != null && !replyToUser.isBlank() ? replyToUser : "还需要一点信息哦：请补充时间、地点和要做什么。";
                        messageService.save(conversationId, userId, safeQuestion, false, true);
                        messageService.save(conversationId, userId, reply, true);
                        emitter.send(SseEmitter.event().data(reply));
                        emitter.send(SseEmitter.event().name("done").data(""));
                        emitter.complete();
                        return emitter;
                    }
                }
            } catch (Exception e) {
                log.warn("[REMINDER] 多轮收集或保存失败，回退为普通对话", e);
            }
        }

        String questionForStream = safeQuestion;
        if (hasImages) {
            try {
                String imageUnderstanding = analyzeImage(imageUrls.get(0), safeQuestion);
                questionForStream = buildImageUnderstandingPrompt(safeQuestion, imageUnderstanding);
            } catch (Exception e) {
                log.warn("[多模态] 图像理解失败，回退为普通问答 userId={} conversationId={}", userId, conversationId, e);
            }
        }

        // 主路径会做 RAG 检索，视为“从向量库找东西”，不把用户问题写入向量库
        messageService.save(conversationId, userId, safeQuestion, false, false);

        StringBuilder fullAnswer = new StringBuilder();
        AtomicInteger chunkCount = new AtomicInteger(0);

        String userContext = buildUserContext(userId);
        String baseSystem = isSpouseUser(userId)
                ? (promptService.getSystemPrompt("ai_chat_system_spouse", "default"))
                : (promptService.getSystemPrompt("ai_chat_system", "default"));
        if (baseSystem == null || baseSystem.isBlank()) {
            baseSystem = isSpouseUser(userId)
                    ? "你是孕期宝的准爸爸/配偶专属助手。帮助准爸爸了解孕期知识、照顾妻子、情感支持。涉及医疗时温和提醒「建议咨询医生」。可输出 markdown。"
                    : """
            你是孕期宝的记录陪伴助手，温暖、细腻、有同理心。
            你的主要职责是：
            1. 帮助用户整理、回顾、提炼孕期记录（日记、照片、语音）
            2. 辅助用户写信给宝宝，润色文字、补充温馨表达
            3. 基于用户已有记录，生成「本周小结」「孕周回顾」等
            4. 在用户不知道写什么时，给出记录灵感建议
            5. 涉及饮食、产检、用药等医疗问题时，温和提醒「建议咨询医生」
            请勿主动提供医疗建议，专注记录与情感陪伴。回答可输出 markdown。
            """;
        }
        if (safeQuestion != null && safeQuestion.contains("写信") && (safeQuestion.contains("宝宝") || safeQuestion.contains("给宝宝") || safeQuestion.contains("对宝宝"))) {
            String letterGuide = promptService.getSystemPrompt("letter_to_baby_guide", "default");
            if (letterGuide != null && !letterGuide.isBlank()) {
                baseSystem = baseSystem + "\n\n" + letterGuide;
            }
        }
        String systemPrompt = baseSystem + (userContext.isEmpty() ? "" : "\n\n当前用户情况：" + userContext);
        final List<String> imageUrlsFromRag = new ArrayList<>();
        log.info("[RAG] 开始检索 userId={} conversationId={} questionLen={}", userId, conversationId, questionForStream != null ? questionForStream.length() : 0);
        try {
            String ragContext = ragService.getRelevant(questionForStream, userId, true);
            log.info("[RAG] 检索完成 userId={} conversationId={} questionPreview={} 结果长度={}", userId, conversationId, questionForStream != null && questionForStream.length() > 50 ? questionForStream.substring(0, 50) + "…" : questionForStream, ragContext != null ? ragContext.length() : 0);
            log.info("[RAG] 检索结果内容：\n{}", ragContext != null ? ragContext : "（空）");
            if (ragContext != null && !ragContext.isBlank() && !ragContext.contains("暂未找到") && !ragContext.contains("不可用") && !ragContext.contains("异常")) {
                systemPrompt = systemPrompt + "\n\n参考以下相关内容（回答时可结合使用）：\n" + ragContext
                        + "\n\n要求：1) 参考内容中的图片链接必须用 Markdown 图片语法输出，例如：![图片](图片URL) 或 ![描述](图片URL)，不要只输出裸链接，否则前端无法渲染。2) 文件链接用 Markdown 链接输出：[点击查看](文件URL)。3) 用户若在找/搜/查某类内容，请优先根据检索结果列出，图片一律用 ![描述](url) 格式。";
                imageUrlsFromRag.addAll(extractImageUrlsFromRagContext(ragContext));
                log.info("[RAG] 从检索结果中提取到图片 URL 数量：{}", imageUrlsFromRag.size());
            }
        } catch (Exception e) {
            log.warn("[RAG] 检索失败，继续无上下文回答 userId={} conversationId={} error={}", userId, conversationId, e.getMessage(), e);
        }
        String memoryContext = buildConversationMemory(conversationId);
        String userPrompt = (memoryContext.isBlank() ? "" : "对话历史（按时间顺序）：\n" + memoryContext + "\n\n")
                + "用户问题：" + questionForStream;

        ChatClient client = ChatClient.builder(openAiChatModel)
                .defaultSystem(systemPrompt)
                .build();

        client.prompt()
                .user(userPrompt)
                .stream()
                .content()
                .subscribeOn(Schedulers.boundedElastic())
                .doOnSubscribe(s -> log.info("[流式] 已订阅 AI 流 userId={} conversationId={}", userId, conversationId))
                .doOnNext(chunk -> {
                    if (chunk != null && !chunk.isEmpty()) {
                        try {
                            // 核心新增：打印每个流式分片的详细日志
                            int currentChunkNum = chunkCount.incrementAndGet();
                            log.info("[流式输出] userId={} conversationId={} 分片#{} | 内容：{} | 长度：{}",
                                    userId, conversationId, currentChunkNum,
                                    // 分片内容过长时只展示前50字符，避免日志刷屏
                                    chunk.length() > 50 ? chunk.substring(0, 50) + "…" : chunk,
                                    chunk.length());

                            // 发送分片给前端
                            emitter.send(SseEmitter.event().data(chunk));
                            fullAnswer.append(chunk);

                            if (currentChunkNum == 1) {
                                log.debug("[流式] 首包 userId={} conversationId={} preview={}",
                                        userId, conversationId,
                                        chunk.length() > 30 ? chunk.substring(0, 30) + "…" : chunk);
                            }
                        } catch (IOException e) {
                            log.warn("[流式] 发送块失败 chunk#={}", chunkCount.get(), e);
                        }
                    }
                })
                .doFinally(signalType -> {
                    // 无论流式成功还是异常结束，都执行：保存 AI 回复 + 配偶提及检测与邮件 + 追加提示并下发给前端
                    try {
                        String full = fullAnswer.toString();
                        boolean mentionDetected = mentionsSpouse(safeQuestion);
                        log.info("[流式结束] userId={} conversationId={} chunkCount={} fullLen={} mentionsSpouse={}",
                                userId, conversationId, chunkCount.get(), full.length(), mentionDetected);
                        String appendText = "";
                        if (mentionDetected) {
                            Family family = familyService.getMyFamily(userId);
                            boolean isPregnant = (family == null) || (family != null && family.getCreatorUserId() != null && family.getCreatorUserId().equals(userId));
                            log.info("[配偶提及] familyNull={} isPregnant={} familyId={}", family == null, isPregnant, family != null ? family.getFamilyId() : null);
                            if (isPregnant) {
                                List<Integer> spouseIds = family != null ? familyService.getSpouseUserIds(userId) : List.of();
                                log.info("[配偶提及] spouseIds={}", spouseIds);
                                if (spouseIds == null || spouseIds.isEmpty()) {
                                    appendText = "\n\n您家里还没有添加配偶，无法代为发送。请先在「家人共享」中设置配偶。";
                                    log.info("[配偶提及] 家庭内无配偶，追加提示 userId={} conversationId={}", userId, conversationId);
                                } else {
                                    User me = userService.getById(userId);
                                    String meName = me != null ? me.getUsername() : "家人";
                                    boolean sent = false;
                                    for (Integer sid : spouseIds) {
                                        User spouse = userService.getById(sid);
                                        if (spouse != null && spouse.getEmail() != null && !spouse.getEmail().isBlank()) {
                                            try {
                                                String subject = "孕期宝：有人在新对话中提到了你";
                                                String snippet = safeQuestion.length() > 100 ? safeQuestion.substring(0, 100) + "…" : safeQuestion;
                                                String body = String.format("你好，%s\n\n%s 在 AI 对话中提到了你。\n\n内容摘要：%s\n\n快去孕期宝看看吧～",
                                                        spouse.getUsername(), meName, snippet);
                                                mailService.sendTextMail(spouse.getEmail(), subject, body);
                                                sent = true;
                                                log.info("[配偶提及] 已发送邮件 userId={} toSpouse={} email={}", userId, sid, spouse.getEmail());
                                                break;
                                            } catch (Exception ex) {
                                                log.warn("[配偶提及] 邮件发送失败 toSpouse={}", sid, ex);
                                            }
                                        }
                                    }
                                    if (sent) {
                                        appendText = "\n\n已发送给配偶了。";
                                    } else {
                                        appendText = "\n\n已尝试通知配偶，但配偶未绑定邮箱，无法发送邮件。";
                                        log.info("[配偶提及] 配偶未填邮箱 userId={} spouseIds={}", userId, spouseIds);
                                    }
                                }
                            } else if (family != null && family.getCreatorUserId() != null) {
                                // 当前用户是配偶：向孕妇（创建者）发邮件
                                User creator = userService.getById(family.getCreatorUserId());
                                if (creator != null && creator.getEmail() != null && !creator.getEmail().isBlank()) {
                                    try {
                                        User me = userService.getById(userId);
                                        String meName = me != null ? me.getUsername() : "家人";
                                        String subject = "孕期宝：配偶在对话中提到了你";
                                        String snippet = safeQuestion.length() > 100 ? safeQuestion.substring(0, 100) + "…" : safeQuestion;
                                        String body = String.format("你好，%s\n\n%s 在 AI 对话中提到了你。\n\n内容摘要：%s\n\n快去孕期宝看看吧～",
                                                creator.getUsername(), meName, snippet);
                                        mailService.sendTextMail(creator.getEmail(), subject, body);
                                        appendText = "\n\n已发送给老婆了。";
                                        log.info("[配偶提及] 配偶发邮件给孕妇 userId={} creatorId={} email={}", userId, family.getCreatorUserId(), creator.getEmail());
                                    } catch (Exception ex) {
                                        log.warn("[配偶提及] 邮件发送给孕妇失败 creatorId={}", family.getCreatorUserId(), ex);
                                        appendText = "\n\n已尝试通知，但邮件发送失败。";
                                    }
                                } else {
                                    appendText = "\n\n孕妇未绑定邮箱，无法发送邮件通知。";
                                    log.info("[配偶提及] 孕妇未填邮箱 creatorId={}", family.getCreatorUserId());
                                }
                            } else {
                                log.info("[配偶提及] 当前用户非孕妇本人且无家庭创建者，不触发邮件 userId={}", userId);
                            }
                        }
                        // RAG 检索到的图片 URL 强制追加为 Markdown 图片，确保前端能渲染（不依赖 AI 是否输出）
                        StringBuilder ragImageAppend = new StringBuilder();
                        if (!imageUrlsFromRag.isEmpty()) {
                            for (String url : imageUrlsFromRag) {
                                ragImageAppend.append("\n\n![图片](").append(url).append(")");
                            }
                            log.info("[RAG] 向回复中追加 {} 张图片的 Markdown", imageUrlsFromRag.size());
                        }
                        String finalMessage = full + ragImageAppend + appendText;
                        messageService.save(conversationId, userId, finalMessage, true);
                        if (ragImageAppend.length() > 0) {
                            emitter.send(SseEmitter.event().data(ragImageAppend.toString()));
                        }
                        if (!appendText.isEmpty()) {
                            emitter.send(SseEmitter.event().data(appendText));
                        }
                        emitter.send(SseEmitter.event().name("done").data(""));
                        emitter.complete();
                        log.info("[流式完成] userId={} conversationId={} spouseAppend={} finalLen={}",
                                userId, conversationId, !appendText.isEmpty(), finalMessage.length());
                    } catch (Exception e) {
                        log.error("[流式] doFinally 保存/追加/完成失败 userId={} conversationId={}", userId, conversationId, e);
                        try {
                            String full = fullAnswer.toString();
                            messageService.save(conversationId, userId, full, true);
                        } catch (Exception saveEx) {
                            log.warn("[流式] 仅保存原文失败", saveEx);
                        }
                        try {
                            emitter.send(SseEmitter.event().data("\n\n回复已保存，通知发送若失败请稍后在家人共享中查看。"));
                            emitter.send(SseEmitter.event().name("done").data(""));
                            emitter.complete();
                        } catch (IOException io) {
                            emitter.completeWithError(io);
                        }
                    }
                })
                .doOnError(err -> {
                    log.error("[流式] 异常 userId={} conversationId={} chunkCount={}", userId, conversationId, chunkCount.get(), err);
                    try {
                        emitter.send(SseEmitter.event().data("\n\n生成出错，请重试。"));
                        fullAnswer.append("\n\n生成出错，请重试。");
                    } catch (IOException ignored) {}
                    // 不在此处 complete，由 doFinally 统一保存并完成，以便配偶提及逻辑仍可执行
                })
                .subscribe();

        return emitter;
    }

    /**
     * 非流式对话（兼容旧前端）：一次性返回完整回复。
     */
    @PostMapping("/chat")
    public Result<String> chat(@RequestParam Integer userId,
                               @RequestParam Integer conversationId,
                               @RequestParam String question) {

        Conversation conv = conversationService.getByIdAndUserId(conversationId, userId);
        if (conv == null) {
            return Result.error(403, ErrorCode.FORBIDDEN.key(), "会话不存在或无权限");
        }

        messageService.save(conversationId, userId, question, false);

        String systemPrompt = isSpouseUser(userId)
                ? promptService.getSystemPrompt("ai_chat_system_spouse", "default")
                : promptService.getSystemPrompt("ai_chat_system_non_stream", "default");
        if (systemPrompt == null || systemPrompt.isBlank()) {
            systemPrompt = isSpouseUser(userId)
                    ? "你是孕期宝的准爸爸/配偶专属助手。帮助准爸爸了解孕期知识、照顾妻子、情感支持。涉及医疗时温和提醒「建议咨询医生」。可输出 markdown。"
                    : """
            你是孕期宝的记录陪伴助手，温暖、细腻、有同理心。
            主要职责：帮助整理记录、写信给宝宝、回顾时光、提供记录灵感。
            涉及医疗问题时温和提醒「建议咨询医生」。专注记录与情感陪伴，可输出 markdown。
            """;
        }

        ChatClient client = ChatClient.builder(openAiChatModel)
                .defaultSystem(systemPrompt)
                .build();

        String memoryContext = buildConversationMemory(conversationId);
        String userPrompt = (memoryContext.isBlank() ? "" : "对话历史（按时间顺序）：\n" + memoryContext + "\n\n")
                + "用户问题：" + question;
        String answer = client.prompt().user(userPrompt).call().content();
        messageService.save(conversationId, userId, answer, true);

        return Result.success(answer);
    }

    private boolean isSpouseUser(Integer userId) {
        if (userId == null) return false;
        User user = userService.getById(userId);
        if (user == null || !"family_member".equals(user.getUserType())) return false;
        return familyMemberMapper.findSpouseByUserId(userId) != null;
    }

    private String buildUserContext(Integer userId) {
        User user = userService.getById(userId);
        if (user == null) return "";
        StringBuilder sb = new StringBuilder();
        if (user.getLastMenstrualDate() != null) {
            String week = PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate());
            sb.append("孕周 ").append(week);
        }
        if (user.getPregnancyTime() != null) {
            if (sb.length() > 0) sb.append("；");
            sb.append("预产期 ").append(user.getPregnancyTime().toLocalDate());
        }
        try {
            int textCount = memoService.getTextByUserId(userId) != null ? memoService.getTextByUserId(userId).size() : 0;
            int photoCount = memoService.getPhotoByUserId(userId) != null ? memoService.getPhotoByUserId(userId).size() : 0;
            int voiceCount = memoService.getVoiceByUserId(userId) != null ? memoService.getVoiceByUserId(userId).size() : 0;
            int total = textCount + photoCount + voiceCount + (memoService.getFileByUserId(userId) != null ? memoService.getFileByUserId(userId).size() : 0);
            if (total > 0) {
                if (sb.length() > 0) sb.append("；");
                sb.append("已有 ").append(total).append(" 条孕期记录");
            }
        } catch (Exception e) {
            log.debug("获取记录数失败", e);
        }
        return sb.toString();
    }

    /**
     * 会话记忆：按时间顺序拼接历史消息，并做长度限制，保证长上下文对话可持续。
     */
    /**
     * 从 RAG 检索结果文本中提取图片 URL（[URL] xxx、裸 https 且含 /photo/ 或图片扩展名）。
     * 用于在流式结束后强制追加到回复，保证前端能渲染图片。
     */
    private List<String> extractImageUrlsFromRagContext(String ragContext) {
        if (ragContext == null || ragContext.isBlank()) {
            return List.of();
        }
        List<String> urls = new ArrayList<>();
        // 1) [URL] https://... 或 【URL】https://...
        Pattern urlLabel = Pattern.compile("(?:\\[URL\\]|【URL】)\\s*(https?://[^\\s\\]\\)]+)");
        Matcher m = urlLabel.matcher(ragContext);
        while (m.find()) {
            String u = m.group(1).trim();
            if (u.endsWith(",") || u.endsWith(".")) u = u.replaceAll("[,.]$", "");
            if (isImageUrl(u)) urls.add(u);
        }
        // 2) 裸的 https 链接：含 /photo/ 或常见图片扩展名（拆成两个简单正则，避免复杂字符类导致 Unclosed group）
        String noSpaces = "[^\\s\\]\"'<>]+";
        Pattern photoUrl = Pattern.compile("(https?://" + noSpaces + "/photo/" + noSpaces + ")", Pattern.CASE_INSENSITIVE);
        m = photoUrl.matcher(ragContext);
        while (m.find()) {
            String u = m.group(1).trim();
            if (isImageUrl(u) && !urls.contains(u)) urls.add(u);
        }
        Pattern extUrl = Pattern.compile("(https?://" + noSpaces + "\\.(?:jpg|jpeg|png|gif|webp|bmp)(?:[?&#][^\\s\\]\"'<>]*)?)", Pattern.CASE_INSENSITIVE);
        m = extUrl.matcher(ragContext);
        while (m.find()) {
            String u = m.group(1).trim();
            if (isImageUrl(u) && !urls.contains(u)) urls.add(u);
        }
        return urls;
    }

    private boolean isImageUrl(String url) {
        if (url == null || url.length() < 10) return false;
        String lower = url.toLowerCase();
        return lower.contains("/photo/") || lower.endsWith(".jpg") || lower.contains(".jpg?")
                || lower.endsWith(".jpeg") || lower.contains(".jpeg?")
                || lower.endsWith(".png") || lower.contains(".png?")
                || lower.endsWith(".gif") || lower.contains(".gif?")
                || lower.endsWith(".webp") || lower.contains(".webp?");
    }

    private String buildConversationMemory(Integer conversationId) {
        List<Message> history = messageService.getHistory(conversationId);
        if (history == null || history.isEmpty()) {
            return "";
        }
        final int maxChars = 18_000;
        StringBuilder tailFirst = new StringBuilder();
        for (int i = history.size() - 1; i >= 0; i--) {
            Message m = history.get(i);
            if (m == null || m.getContent() == null || m.getContent().isBlank()) continue;
            String role = Boolean.TRUE.equals(m.getIsAi()) ? "助手" : "用户";
            String line = role + "：" + m.getContent().trim() + "\n";
            if (tailFirst.length() + line.length() > maxChars) {
                break;
            }
            tailFirst.insert(0, line);
        }
        return tailFirst.toString();
    }

    private List<String> uploadUserImages(Integer userId, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }
        return images.stream()
                .filter(f -> f != null && !f.isEmpty())
                .map(f -> aliOssUtil.uploadChatImage(userId, f))
                .toList();
    }

    private String buildUserMessageContent(String question, List<String> imageUrls) {
        StringBuilder sb = new StringBuilder();
        for (String url : imageUrls) {
            sb.append("![用户上传图片](").append(url).append(")\n");
        }
        if (question != null && !question.isBlank()) {
            if (sb.length() > 0) {
                sb.append("\n");
            }
            sb.append(question);
        }
        return sb.length() > 0 ? sb.toString() : "（空消息）";
    }

    private ChatIntent detectIntent(String question, boolean hasImage) {
        if (!hasImage && question != null && question.trim().contains("提醒")) {
            return ChatIntent.REMINDER;
        }
        // 短句且无图片、无画图/生成关键词时直接走对话，不调 LLM 意图识别，避免阻塞流式首包
        String q = question != null ? question.trim() : "";
        if (!hasImage && q.length() > 0 && q.length() <= 20
                && !q.contains("画") && !q.contains("生成") && !q.contains("图") && !q.contains("提醒")
                && !q.contains("找") && !q.contains("搜") && !q.contains("查")) {
            return ChatIntent.TEXT_CHAT;
        }
        try {
            String systemPrompt = promptService.getSystemPrompt("intent_detect", "default");
            if (systemPrompt == null || systemPrompt.isBlank()) {
                systemPrompt = "你是多模态意图识别器。你只能返回以下5个标签之一（不得返回其他字符）：\nTEXT_CHAT\nTEXT_TO_IMAGE\nIMAGE_TO_IMAGE\nIMAGE_UNDERSTANDING\nREMINDER\n规则：\n1) 无图片输入时，返回 TEXT_CHAT、TEXT_TO_IMAGE 或 REMINDER。\n2) 有图片输入时，只能返回 IMAGE_TO_IMAGE 或 IMAGE_UNDERSTANDING。\n3) 用户明确要求「生成图/画图/改图/风格迁移/变体」时，才返回 *_TO_IMAGE。\n4) 用户说「找图/搜图/查图/查找图片」等查找、检索意图时，必须返回 TEXT_CHAT（无图）或 IMAGE_UNDERSTANDING（有图），不能返回 *_TO_IMAGE。\n5) 用户是问图片内容、解释图片时，返回 IMAGE_UNDERSTANDING。\n6) 用户要求提醒、定时时，返回 REMINDER。";
            }
            String userPrompt = promptService.getUserPrompt("intent_detect", "default",
                    Map.of("hasImage", String.valueOf(hasImage), "question", question != null ? question : ""));
            if (userPrompt == null || userPrompt.isBlank()) {
                userPrompt = "hasImage=" + hasImage + "\n用户输入：" + (question == null ? "" : question);
            }
            String raw = ChatClient.builder(openAiChatModel)
                    .defaultSystem(systemPrompt)
                    .build()
                    .prompt()
                    .user(userPrompt)
                    .call()
                    .content();
            if (raw == null) {
                return hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_CHAT;
            }
            String token = raw.trim().toUpperCase();
            boolean isSearchIntent = (q.contains("找") || q.contains("搜") || q.contains("查") || q.contains("看看")) && !q.contains("生成") && !q.contains("画") && !q.contains("做图");
            if (isSearchIntent && ("TEXT_TO_IMAGE".equals(token) || "IMAGE_TO_IMAGE".equals(token))) {
                return hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_CHAT;
            }
            return switch (token) {
                case "TEXT_TO_IMAGE" -> hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_TO_IMAGE;
                case "IMAGE_TO_IMAGE" -> hasImage ? ChatIntent.IMAGE_TO_IMAGE : ChatIntent.TEXT_CHAT;
                case "IMAGE_UNDERSTANDING" -> hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_CHAT;
                case "REMINDER" -> hasImage ? ChatIntent.TEXT_CHAT : ChatIntent.REMINDER;
                default -> hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_CHAT;
            };
        } catch (Exception e) {
            log.warn("[多模态] 意图识别失败，使用默认策略", e);
            return hasImage ? ChatIntent.IMAGE_UNDERSTANDING : ChatIntent.TEXT_CHAT;
        }
    }

    private String buildImageUnderstandingPrompt(String userQuestion, String imageUnderstanding) {
        String q = (userQuestion == null || userQuestion.isBlank())
                ? "请基于图片给出温暖、细腻的描述与建议。"
                : userQuestion;
        return "图像理解结果：\n" + imageUnderstanding + "\n\n用户补充问题：\n" + q + "\n\n请结合两者回答。";
    }

    private String generateImageFromText(Integer userId, String question) throws Exception {
        String prompt = (question == null || question.isBlank())
                ? "请生成一张温馨、治愈风格的孕期插画。"
                : question;
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", MODEL_IMAGE);
        ArrayNode messages = body.putArray("messages");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        ArrayNode content = user.putArray("content");
        content.addObject().put("type", "text").put("text", prompt);
        String contentText = callAiChatCompletions(body);
        return extractAndUploadGeneratedImage(userId, contentText);
    }

    private String generateImageFromImage(Integer userId, String question, String imageUrl) throws Exception {
        String prompt = (question == null || question.isBlank())
                ? "基于这张图片生成一个风格柔和、细节清晰的高质量变体。"
                : question;
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", MODEL_IMAGE);
        ArrayNode messages = body.putArray("messages");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        ArrayNode content = user.putArray("content");
        content.addObject().put("type", "text").put("text", prompt);
        ObjectNode imagePart = content.addObject();
        imagePart.put("type", "image_url");
        imagePart.putObject("image_url").put("url", imageUrl);
        String contentText = callAiChatCompletions(body);
        return extractAndUploadGeneratedImage(userId, contentText);
    }

    private String analyzeImage(String imageUrl, String userQuestion) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", MODEL_TEXT_CHAT);
        body.put("temperature", 0.2);
        body.put("top_p", 0.7);
        ArrayNode messages = body.putArray("messages");
        String imgSysPrompt = promptService.getSystemPrompt("image_understanding_system", "default");
        if (imgSysPrompt == null || imgSysPrompt.isBlank()) {
            imgSysPrompt = "你是图像理解助手。请准确提炼图片中的主体、场景、情绪和关键细节，输出自然中文段落。";
        }
        messages.addObject().put("role", "system").put("content", imgSysPrompt);

        ObjectNode user = messages.addObject();
        user.put("role", "user");
        ArrayNode content = user.putArray("content");
        content.addObject().put("type", "image_url")
                .putObject("image_url").put("url", imageUrl).put("detail", "high");
        String ask;
        if (userQuestion == null || userQuestion.isBlank()) {
            ask = promptService.getUserPrompt("image_understanding_user_empty", "default", Map.of());
        } else {
            ask = promptService.getUserPrompt("image_understanding_user", "default", Map.of("userQuestion", userQuestion));
        }
        if (ask == null || ask.isBlank()) {
            ask = (userQuestion == null || userQuestion.isBlank())
                    ? "请先理解这张图片，再给出温暖、细腻的描述。"
                    : "请先理解这张图片，再结合这句话重点分析：" + userQuestion;
        }
        content.addObject().put("type", "text").put("text", ask);
        return callAiChatCompletions(body);
    }

    private String callAiChatCompletions(ObjectNode body) throws Exception {
        String base = aiBaseUrl.endsWith("/") ? aiBaseUrl.substring(0, aiBaseUrl.length() - 1) : aiBaseUrl;
        String url = base + "/v1/chat/completions";
        String payload = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(payload, okhttp3.MediaType.parse("application/json; charset=utf-8"));
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(120, TimeUnit.SECONDS)
                .build();
        Request request = new Request.Builder()
                .url(url)
                .post(requestBody)
                .addHeader("Authorization", "Bearer " + aiApiKey)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .addHeader("Content-Length", String.valueOf(payload.getBytes(StandardCharsets.UTF_8).length))
                .build();
        try (Response response = client.newCall(request).execute()) {
            String bodyText = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                log.warn("AI 请求失败 code={} body={}", response.code(), bodyText);
                throw new BusinessException(ErrorCode.AI_SERVICE_ERROR.code(), ErrorCode.AI_SERVICE_ERROR.key(), "AI 服务暂时不可用，请稍后重试");
            }
            JsonNode root = objectMapper.readTree(bodyText);
            String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
            if (content.isEmpty()) {
                throw new BusinessException(ErrorCode.AI_SERVICE_ERROR.code(), ErrorCode.AI_SERVICE_ERROR.key(), "AI 返回为空，请稍后重试");
            }
            return content;
        }
    }

    private String extractAndUploadGeneratedImage(Integer userId, String modelContent) {
        Matcher matcher = DATA_IMAGE_PATTERN.matcher(modelContent == null ? "" : modelContent);
        if (!matcher.find()) {
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR.code(), ErrorCode.AI_SERVICE_ERROR.key(), "生成图片失败，请稍后重试");
        }
        String ext = matcher.group(1);
        String base64 = matcher.group(2);
        byte[] bytes = Base64.getDecoder().decode(base64);
        return aliOssUtil.uploadChatImage(userId, bytes, ext);
    }

    private enum ChatIntent {
        TEXT_CHAT,
        TEXT_TO_IMAGE,
        IMAGE_TO_IMAGE,
        IMAGE_UNDERSTANDING,
        REMINDER
    }

    @GetMapping("/community/templates/public")
    public Result<List<AiTemplate>> listPublicTemplates() {
        return Result.success(aiTemplateMapper.listPublicTemplates());
    }

    @GetMapping("/community/templates/mine")
    public Result<List<AiTemplate>> listMyTemplates(@RequestParam Integer userId) {
        return Result.success(aiTemplateMapper.listByUserId(userId));
    }

    @PostMapping("/community/templates/create")
    public Result<AiTemplate> createTemplate(@RequestParam Integer userId,
                                             @RequestParam String title,
                                             @RequestParam String promptText,
                                             @RequestParam(required = false) String category,
                                             @RequestParam(defaultValue = "false") boolean isPublic) {
        AiTemplate template = new AiTemplate();
        template.setUserId(userId);
        template.setTitle(title);
        template.setPromptText(promptText);
        template.setCategory(category);
        template.setIsPublic(isPublic);
        template.setUsageCount(0);
        aiTemplateMapper.insert(template);
        return Result.success(template);
    }

    @PostMapping("/community/templates/toggle-public")
    public Result<Boolean> toggleTemplatePublic(@RequestParam Integer userId,
                                                @RequestParam Integer templateId,
                                                @RequestParam boolean isPublic) {
        return Result.success(aiTemplateMapper.updatePublicStatus(templateId, userId, isPublic) > 0);
    }

    @GetMapping("/community/posts/public/latest")
    public Result<List<Map<String, Object>>> listPublicLatestPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        int offset = (page - 1) * pageSize;
        return Result.success(withAuthor(aiGenerationPostMapper.listPublicLatestPaged(pageSize, offset)));
    }

    @GetMapping("/community/posts/public/recommended")
    public Result<List<Map<String, Object>>> listPublicRecommendedPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        int offset = (page - 1) * pageSize;
        return Result.success(withAuthor(aiGenerationPostMapper.listPublicRecommendedPaged(pageSize, offset)));
    }

    @GetMapping("/community/posts/mine")
    public Result<List<Map<String, Object>>> listMyPosts(@RequestParam Integer userId) {
        return Result.success(withAuthor(aiGenerationPostMapper.listByUserId(userId)));
    }

    @PostMapping("/community/posts/toggle-public")
    public Result<Boolean> togglePostPublic(@RequestParam Integer userId,
                                            @RequestParam Integer postId,
                                            @RequestParam boolean isPublic) {
        if (isPublic) {
            User user = userService.getById(userId);
            if (Boolean.TRUE.equals(user != null ? user.getIsSpouse() : null)) {
                return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "配偶不可将作品公开到社区");
            }
        }
        return Result.success(aiGenerationPostMapper.updatePublicStatus(postId, userId, isPublic) > 0);
    }

    @PostMapping("/community/image-to-image")
    public Result<Map<String, Object>> communityImageToImage(@RequestParam Integer userId,
                                                             @RequestParam("image") MultipartFile image,
                                                             @RequestParam(required = false) Integer templateId,
                                                             @RequestParam(required = false) String prompt,
                                                             @RequestParam(defaultValue = "false") boolean publishPost,
                                                             @RequestParam(defaultValue = "false") boolean publishTemplate,
                                                             @RequestParam(required = false) String templateTitle,
                                                             @RequestParam(required = false) String category) throws Exception {
        if (image == null || image.isEmpty()) {
            return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "请上传1张图片");
        }
        if (image.getSize() > 10 * 1024 * 1024) {
            return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "图片不能超过10MB");
        }
        if (publishPost) {
            User user = userService.getById(userId);
            if (Boolean.TRUE.equals(user != null ? user.getIsSpouse() : null)) {
                return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "配偶不可将作品公开到社区");
            }
        }

        String inputImageUrl = aliOssUtil.uploadChatImage(userId, image);
        String finalPrompt = buildCommunityPrompt(templateId, prompt);
        String outputImageUrl = generateImageFromImage(userId, finalPrompt, inputImageUrl);

        Integer savedTemplateId = templateId;
        if (savedTemplateId == null && templateTitle != null && !templateTitle.isBlank()) {
            AiTemplate t = new AiTemplate();
            t.setUserId(userId);
            t.setTitle(templateTitle.trim());
            t.setPromptText(finalPrompt);
            t.setCategory(category);
            t.setIsPublic(publishTemplate);
            t.setUsageCount(1);
            aiTemplateMapper.insert(t);
            savedTemplateId = t.getTemplateId();
        } else if (savedTemplateId != null) {
            aiTemplateMapper.incrementUsageCount(savedTemplateId);
        }

        AiGenerationPost post = new AiGenerationPost();
        post.setUserId(userId);
        post.setTemplateId(savedTemplateId);
        post.setInputImageUrl(inputImageUrl);
        post.setOutputImageUrl(outputImageUrl);
        post.setPromptText(finalPrompt);
        post.setIsPublic(publishPost);
        aiGenerationPostMapper.insert(post);

        Map<String, Object> data = new HashMap<>();
        data.put("postId", post.getPostId());
        data.put("templateId", savedTemplateId);
        data.put("inputImageUrl", inputImageUrl);
        data.put("outputImageUrl", outputImageUrl);
        data.put("isPublic", publishPost);
        return Result.success(data);
    }

    private String buildCommunityPrompt(Integer templateId, String prompt) {
        String basePrompt = promptService.getUserPrompt("community_image_base", "default", Map.of());
        if (basePrompt == null || basePrompt.isBlank()) {
            basePrompt = "请基于输入的B超或孕期图片，生成一张温暖、真实、柔和光线的新生儿想象照。\n要求：五官自然、皮肤细节真实、避免恐怖/畸形元素，构图干净，高清。";
        }
        if (templateId != null) {
            AiTemplate t = aiTemplateMapper.findById(templateId);
            if (t != null && t.getPromptText() != null && !t.getPromptText().isBlank()) {
                basePrompt = t.getPromptText();
            }
        }
        if (prompt == null || prompt.isBlank()) {
            return basePrompt;
        }
        return basePrompt + "\n补充要求：" + prompt;
    }

    private List<Map<String, Object>> withAuthor(List<AiGenerationPost> posts) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (AiGenerationPost post : posts) {
            Map<String, Object> item = new HashMap<>();
            item.put("post", post);
            User author = userService.getById(post.getUserId());
            item.put("authorName", author != null ? author.getUsername() : "用户");
            item.put("likeCount", aiGenerationPostLikeMapper.countByPostId(post.getPostId()));
            item.put("commentCount", aiGenerationPostCommentMapper.listByPostId(post.getPostId()).size());
            out.add(item);
        }
        return out;
    }

    @GetMapping("/community/post/like/count")
    public Result<Integer> getCommunityLikeCount(@RequestParam Integer postId) {
        return Result.success(aiGenerationPostLikeMapper.countByPostId(postId));
    }

    @GetMapping("/community/post/like/status")
    public Result<Boolean> getCommunityLikeStatus(@RequestParam Integer postId, @RequestParam Integer userId) {
        return Result.success(aiGenerationPostLikeMapper.findByPostAndUser(postId, userId) != null);
    }

    @PostMapping("/community/post/like/toggle")
    public Result<Map<String, Object>> toggleCommunityLike(@RequestParam Integer postId, @RequestParam Integer userId) {
        AiGenerationPostLike existing = aiGenerationPostLikeMapper.findByPostAndUser(postId, userId);
        boolean liked;
        if (existing != null) {
            aiGenerationPostLikeMapper.deleteByPostAndUser(postId, userId);
            liked = false;
        } else {
            AiGenerationPostLike like = new AiGenerationPostLike();
            like.setPostId(postId);
            like.setUserId(userId);
            aiGenerationPostLikeMapper.insert(like);
            liked = true;
        }
        int count = aiGenerationPostLikeMapper.countByPostId(postId);
        return Result.success(Map.of("liked", liked, "count", count));
    }

    @GetMapping("/community/post/comments")
    public Result<List<Map<String, Object>>> getCommunityComments(@RequestParam Integer postId,
                                                                  @RequestParam(required = false) Integer requestUserId) {
        List<AiGenerationPostComment> comments = aiGenerationPostCommentMapper.listByPostId(postId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AiGenerationPostComment c : comments) {
            User u = userService.getById(c.getUserId());
            Map<String, Object> row = new HashMap<>();
            row.put("commentId", c.getCommentId());
            row.put("postId", c.getPostId());
            row.put("parentCommentId", c.getParentCommentId());
            row.put("userId", c.getUserId());
            row.put("username", u != null ? u.getUsername() : "用户");
            row.put("userType", u != null ? u.getUserType() : null);
            row.put("content", c.getContent());
            row.put("createdAt", c.getCreatedAt());
            row.put("updatedAt", c.getUpdatedAt());
            row.put("likeCount", aiGenerationPostCommentLikeMapper.countByCommentId(c.getCommentId()));
            row.put("isLiked", requestUserId != null && aiGenerationPostCommentLikeMapper.findByCommentAndUser(c.getCommentId(), requestUserId) != null);
            result.add(row);
        }
        return Result.success(result);
    }

    @PostMapping("/community/post/comment")
    public Result<AiGenerationPostComment> addCommunityComment(@RequestParam Integer postId,
                                                               @RequestParam Integer userId,
                                                               @RequestParam String content,
                                                               @RequestParam(required = false) Integer parentCommentId) {
        if (content == null || content.trim().isEmpty()) {
            return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "评论内容不能为空");
        }
        AiGenerationPostComment comment = new AiGenerationPostComment();
        comment.setPostId(postId);
        comment.setParentCommentId(parentCommentId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        aiGenerationPostCommentMapper.insert(comment);
        return Result.success(comment);
    }

    @PostMapping("/community/post/comment/like/toggle")
    public Result<Map<String, Object>> toggleCommentLike(@RequestParam Integer commentId,
                                                         @RequestParam Integer userId) {
        AiGenerationPostCommentLike existing = aiGenerationPostCommentLikeMapper.findByCommentAndUser(commentId, userId);
        boolean liked;
        if (existing != null) {
            aiGenerationPostCommentLikeMapper.deleteByCommentAndUser(commentId, userId);
            liked = false;
        } else {
            AiGenerationPostCommentLike like = new AiGenerationPostCommentLike();
            like.setCommentId(commentId);
            like.setUserId(userId);
            aiGenerationPostCommentLikeMapper.insert(like);
            liked = true;
        }
        int count = aiGenerationPostCommentLikeMapper.countByCommentId(commentId);
        return Result.success(Map.of("liked", liked, "count", count));
    }

    @PutMapping("/community/post/comment")
    public Result<Boolean> updateCommunityComment(@RequestParam Integer commentId,
                                                  @RequestParam Integer userId,
                                                  @RequestParam String content) {
        AiGenerationPostComment existed = aiGenerationPostCommentMapper.findById(commentId);
        if (existed == null) return Result.error(404, ErrorCode.NOT_FOUND.key(), "评论不存在");
        if (!existed.getUserId().equals(userId)) return Result.error(403, ErrorCode.FORBIDDEN.key(), "无权限编辑此评论");
        if (content == null || content.trim().isEmpty()) return Result.error(422, ErrorCode.VALIDATION_ERROR.key(), "评论内容不能为空");
        return Result.success(aiGenerationPostCommentMapper.updateContent(commentId, content.trim()) > 0);
    }

    @DeleteMapping("/community/post/comment")
    public Result<Boolean> deleteCommunityComment(@RequestParam Integer commentId,
                                                  @RequestParam Integer userId) {
        AiGenerationPostComment existed = aiGenerationPostCommentMapper.findById(commentId);
        if (existed == null) return Result.success(false);
        if (!existed.getUserId().equals(userId)) return Result.error(403, ErrorCode.FORBIDDEN.key(), "无权限删除此评论");
        return Result.success(aiGenerationPostCommentMapper.deleteById(commentId) > 0);
    }

    /** 产检提醒：调用 AI 生成，不存库，conversationId 随意传 */
    @GetMapping("/prenatalReminder")
    public Result<String> prenatalReminder(@RequestParam Integer userId,
                                          @RequestParam(required = false) Integer conversationId) {
        User user = userService.getById(userId);
        if (user == null) return Result.error(404, ErrorCode.NOT_FOUND.key(), "用户不存在");
        String week = user.getLastMenstrualDate() != null
                ? PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate()) : "未知";
        String promptStr = promptService.getUserPrompt("prenatal_reminder", "default", Map.of("week", week));
        if (promptStr == null || promptStr.isBlank()) promptStr = "用户当前孕周" + week + "，请用1-2句话简洁提醒产检注意事项，不要换行，直接给出一段话。";
        String result = ChatClient.builder(openAiChatModel).build()
                .prompt().user(promptStr).call().content();
        return Result.success(result != null ? result.trim() : "");
    }

    /** 宝宝成长：调用 AI 生成，不存库 */
    @GetMapping("/babyGrowth")
    public Result<String> babyGrowth(@RequestParam Integer userId,
                                    @RequestParam(defaultValue = "0") int week,
                                    @RequestParam(required = false) Integer conversationId) {
        User user = userService.getById(userId);
        if (user == null) return Result.error(404, ErrorCode.NOT_FOUND.key(), "用户不存在");
        int w = week > 0 ? week : 0;
        if (w == 0 && user.getLastMenstrualDate() != null) {
            try {
                String ws = PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate()).replaceAll("\\D", "");
                w = ws.isEmpty() ? 20 : Math.min(40, Math.max(4, Integer.parseInt(ws)));
            } catch (Exception e) {
                w = 20;
            }
        }
        if (w == 0) w = 20;
        if (w < 4) w = 4;
        if (w > 40) w = 40;
        String promptStr = promptService.getUserPrompt("baby_growth", "default", Map.of("week", String.valueOf(w)));
        if (promptStr == null || promptStr.isBlank()) promptStr = "用户当前孕" + w + "周，请用2-3句话描述宝宝本周发育情况，温馨简洁，不要换行。";
        String result = ChatClient.builder(openAiChatModel).build()
                .prompt().user(promptStr).call().content();
        return Result.success(result != null ? result.trim() : "");
    }

    /** 本周提示：调用 AI 生成一行提示 */
    @GetMapping("/weeklyTip")
    public Result<String> weeklyTip(@RequestParam Integer userId,
                                   @RequestParam(defaultValue = "0") int week) {
        User user = userService.getById(userId);
        if (user == null) return Result.error(404, ErrorCode.NOT_FOUND.key(), "用户不存在");
        int w = week > 0 ? week : 0;
        if (w == 0 && user.getLastMenstrualDate() != null) {
            try {
                String ws = PregnancyWeekUtil.calculatePregnancyWeek(user.getLastMenstrualDate()).replaceAll("\\D", "");
                w = ws.isEmpty() ? 20 : Math.min(40, Math.max(4, Integer.parseInt(ws)));
            } catch (Exception e) {
                w = 20;
            }
        }
        if (w == 0) w = 20;
        if (w < 4) w = 4;
        if (w > 40) w = 40;
        String promptStr = promptService.getUserPrompt("weekly_tip", "default", Map.of("week", String.valueOf(w)));
        if (promptStr == null || promptStr.isBlank()) promptStr = "孕" + w + "周：请用一句话给出本周最重要的孕期提示，不超过30字，不要换行、不要序号、不要引号，直接输出内容。";
        String result = ChatClient.builder(openAiChatModel).build()
                .prompt().user(promptStr).call().content();
        if (result != null) {
            result = result.replaceAll("[\\r\\n]+", " ").trim();
        }
        return Result.success(result != null ? result : "保持好心情，注意均衡饮食");
    }
}
