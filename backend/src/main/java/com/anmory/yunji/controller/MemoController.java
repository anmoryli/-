package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.File;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.Photo;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.entity.Voice;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.ImageUnderstandingService;
import com.anmory.yunji.service.MemoAiEnrichmentService;
import com.anmory.yunji.service.MentionMailService;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.TextMapper;
import com.anmory.yunji.common.RagService;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.MemoService;
import com.anmory.yunji.service.PdfExportService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserNotificationService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.dto.EnrichedMemoItem;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.utils.AliOssUtil;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/memo")
@RequiredArgsConstructor // 构造器注入依赖
public class MemoController {

    private final MemoService memoService;
    private final AliOssUtil aliOssUtil;
    private final ChatClient chatClient;
    private final UserService userService;
    private final PdfExportService pdfExportService;
    private final PromptService promptService;
    private final FamilyService familyService;
    private final MailService mailService;
    private final UserNotificationService userNotificationService;
    private final MentionMailService mentionMailService;
    private final MemoAiEnrichmentService memoAiEnrichmentService;
    private final ImageUnderstandingService imageUnderstandingService;
    private final TextMapper textMapper;
    private final MemoMapper memoMapper;
    private final RagService ragService;

    // ========== 从用户表获取末次月经日，用于计算孕周 ==========
    private String getLastMenstrualDate(Integer userId) {
        var user = userService.getById(userId);
        if (user == null || user.getLastMenstrualDate() == null) return null;
        return user.getLastMenstrualDate().toString();
    }

    /** 校验并规范化 visibleTo。allowlist 时确保配偶在列表中；blocklist 时孕妇与配偶互相不可设为不可见，从 blocklist 中移除对方。 */
    private String validateAndNormalizeVisibleTo(Integer userId, String visibilityMode, String visibleTo) {
        if (visibilityMode == null || visibilityMode.isBlank()) visibilityMode = "all";
        if ("all".equals(visibilityMode)) return null;
        if ("blocklist".equals(visibilityMode)) {
            Set<Integer> blocked = parseVisibleToIds(visibleTo);
            if (blocked == null || blocked.isEmpty()) return visibleTo;
            com.anmory.yunji.entity.Family family = familyService.getMyFamily(userId);
            if (family != null && family.getCreatorUserId() != null) {
                blocked.remove(family.getCreatorUserId());
                List<Integer> spouseIds = familyService.getSpouseUserIds(family.getCreatorUserId());
                if (spouseIds != null) blocked.removeAll(spouseIds);
            }
            if (blocked.isEmpty()) return null;
            return String.join(",", blocked.stream().map(String::valueOf).toList());
        }
        if ("allowlist".equals(visibilityMode)) {
            List<Integer> spouseIds = familyService.getSpouseUserIds(userId);
            if (spouseIds.isEmpty()) return visibleTo;
            Set<Integer> allowed = parseVisibleToIds(visibleTo);
            if (allowed == null) return visibleTo;
            for (Integer sid : spouseIds) {
                if (!allowed.contains(sid)) allowed.add(sid);
            }
            return String.join(",", allowed.stream().map(String::valueOf).toList());
        }
        return visibleTo;
    }

    /** 当前用户是否为某家庭的配偶（爸爸） */
    private boolean isSpouseUser(Integer userId) {
        com.anmory.yunji.entity.Family f = familyService.getMyFamily(userId);
        if (f == null || f.getCreatorUserId() == null) return false;
        List<Integer> spouseIds = familyService.getSpouseUserIds(f.getCreatorUserId());
        return spouseIds != null && spouseIds.contains(userId);
    }

    private Set<Integer> parseVisibleToIds(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Set<Integer> ids = new HashSet<>();
        for (String s : raw.split("[,;]")) {
            String t = s.trim().replaceAll("[\\[\\]\"]", "");
            if (t.isEmpty()) continue;
            try {
                ids.add(Integer.parseInt(t));
            } catch (NumberFormatException ignored) {}
        }
        return ids.isEmpty() ? null : ids;
    }

    // ========== 文字记录 ==========
    @RequestMapping("/addText")
    public Result<Integer> addText(@RequestParam("userId") Integer userId,
                                   @RequestParam(value = "title", required = false) String title,
                                   @RequestParam("content") String content,
                                   @RequestParam(value = "tag", required = false) String tag,
                                   @RequestParam(value = "mood", required = false) String mood,
                                   @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                   @RequestParam(value = "visibleTo", required = false) String visibleTo,
                                   @RequestParam(value = "category", required = false) String category) {
        // 1. 计算孕周
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);

        // 2. 占位标题（用户未传时先用占位，AI 异步生成后更新）
        String saveTitle = (title != null && !title.trim().isEmpty())
                ? title.trim()
                : (content != null && content.length() > 20 ? content.substring(0, 20) + "…" : (content != null && !content.isEmpty() ? content : "记录"));

        // 3. 校验可见范围
        String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
        String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);

        // 4. 先保存记录（category 可为空，AI 异步补齐）
        Integer memoId = memoService.addTextMemo(userId, saveTitle, content, pregnancyWeek, tag, mood, mode, finalVisibleTo, category);

        // 5. 异步 AI 生成标题和分类（用户未提供时）
        if ((title == null || title.trim().isEmpty()) || (category == null || category.trim().isEmpty())) {
            memoAiEnrichmentService.enrichTextAsync(memoId, content);
        }

        // 6. 提及家庭成员时异步发邮件
        mentionMailService.notifyMentionedMembersAsync(userId, memoId, "text", saveTitle, content);
        // 7. 孕妇新记录时通知配偶（有则发邮件，无则提醒加入）
        mentionMailService.notifySpouseNewRecordAsync(userId, memoId, "text", saveTitle, content);
        // 8. RAG 异步嵌入文字记录
        if (content != null && !content.isBlank()) {
            ragService.embedAsync(userId, content, "memo", String.valueOf(memoId));
        }
        return Result.success(memoId);
    }

    /** 灵感/帮写：新建文字记录时根据当前内容与孕周生成一段灵感或开头草稿，不落库 */
    @RequestMapping("/inspire")
    public Result<String> inspire(@RequestParam("userId") Integer userId,
                                 @RequestParam(value = "content", required = false) String content,
                                 @RequestParam(value = "week", required = false) String week,
                                 @RequestParam(value = "tag", required = false) String tag) {
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String weekStr = week != null && !week.isBlank() ? week : PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);
        if (weekStr == null || weekStr.isBlank()) weekStr = "未知";
        String tagStr = tag != null && !tag.isBlank() ? tag : "日记";
        String contentStr = content != null ? content : "";
        String promptKey = isSpouseUser(userId) ? "memo_inspire_dad" : "memo_inspire";
        String promptStr = promptService.getUserPrompt(promptKey, "default",
                Map.of("week", weekStr, "tag", tagStr, "content", contentStr));
        if (promptStr == null || promptStr.isBlank()) {
            promptStr = "孕周：" + weekStr + "。标签：" + tagStr + "。用户已写内容：" + contentStr + "\n\n请生成一段孕期记录灵感或开头草稿（80～200 字），只输出正文。";
        }
        try {
            String out = chatClient.prompt().user(promptStr).call().content();
            return Result.success(out != null ? out.trim() : "");
        } catch (Exception e) {
            log.warn("AI 帮写失败 userId={}", userId, e);
            return Result.error("灵感生成失败，请稍后重试");
        }
    }

    /** 笔记 AI 美化预览：仅文字记录，返回美化后的正文，不落库 */
    @RequestMapping("/beautify-preview")
    public Result<String> beautifyPreview(@RequestParam("memoId") Integer memoId, @RequestParam("userId") Integer userId) {
        Memo memo = memoMapper.selectById(memoId);
        if (memo == null || !memo.getUserId().equals(userId)) {
            return Result.error("记录不存在或无权限");
        }
        if (!"text".equals(memo.getType())) {
            return Result.error("仅支持对文字记录进行美化");
        }
        Text text = textMapper.selectByMemoId(memoId);
        if (text == null || text.getContent() == null || text.getContent().isBlank()) {
            return Result.error("无文字内容可美化");
        }
        String promptKey = isSpouseUser(memo.getUserId()) ? "memo_beautify_dad" : "memo_beautify";
        String promptStr = promptService.getUserPrompt(promptKey, "default", Map.of("content", text.getContent()));
        if (promptStr == null || promptStr.isBlank()) {
            promptStr = "请将以下孕期记录美化润色，只输出美化后的正文：\n\n" + text.getContent();
        }
        try {
            String beautified = chatClient.prompt().user(promptStr).call().content();
            return Result.success(beautified != null ? beautified.trim() : "");
        } catch (Exception e) {
            log.warn("AI 美化失败 memoId={}", memoId, e);
            return Result.error("美化生成失败，请稍后重试");
        }
    }

    @RequestMapping("/updateText")
    public Result<Boolean> updateText(@RequestParam("textId") Integer textId,
                                      @RequestParam("title") String title,
                                      @RequestParam("content") String content,
                                      @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                      @RequestParam(value = "visibleTo", required = false) String visibleTo,
                                      @RequestParam(value = "userId", required = false) Integer userId) {
        Boolean success = memoService.updateTextMemo(textId, title, content);
        if (success && userId != null && (visibilityMode != null || visibleTo != null)) {
            Integer memoId = textMapper.selectMemoIdByTextId(textId);
            if (memoId != null) {
                String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
                String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);
                memoService.updateMemoVisibility(memoId, userId, mode, finalVisibleTo);
            }
        }
        if (success && content != null && !content.isBlank()) {
            Integer memoId = textMapper.selectMemoIdByTextId(textId);
            if (memoId != null && userId != null) {
                ragService.embedAsync(userId, content, "memo", String.valueOf(memoId));
            }
        }
        return Result.success(success);
    }

    @RequestMapping("/updateVisibility")
    public Result<Boolean> updateVisibility(@RequestParam("memoId") Integer memoId,
                                            @RequestParam("userId") Integer userId,
                                            @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                            @RequestParam(value = "visibleTo", required = false) String visibleTo) {
        String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
        String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);
        Boolean success = memoService.updateMemoVisibility(memoId, userId, mode, finalVisibleTo);
        return Result.success(success);
    }

    @RequestMapping("/deleteText")
    public Result<Boolean> deleteText(@RequestParam("memoId") Integer memoId) {
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/getTextByUserId")
    public Result<List<Text>> getTextByUserId(@RequestParam("userId") Integer userId) {
        List<Text> textList = memoService.getTextByUserId(userId);
        return Result.success(textList);
    }

    // ========== 语音记录 ==========
    @RequestMapping("/addVoice")
    public Result<Integer> addVoice(@RequestParam(value = "userId", required = false) Integer userId,
                                    @RequestParam(value = "title", required = false) String title,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestParam(value = "mood", required = false) String mood,
                                    @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                    @RequestParam(value = "visibleTo", required = false) String visibleTo,
                                    @RequestParam(value = "category", required = false) String category) {
        if (userId == null) {
            return Result.error("缺少 userId");
        }
        if (file == null || file.isEmpty()) {
            return Result.error("请选择要上传的语音文件");
        }
        try {
            String voiceUrl = aliOssUtil.uploadVoice(userId, file);
            String lastMenstrualDate = getLastMenstrualDate(userId);
            String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);
            String saveTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : "语音记录";
            String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
            String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);
            Integer memoId = memoService.addVoiceMemo(userId, saveTitle, voiceUrl, pregnancyWeek, mood, mode, finalVisibleTo, category);
            mentionMailService.notifySpouseNewRecordAsync(userId, memoId, "voice", saveTitle, null);
            return Result.success(memoId);
        } catch (Exception e) {
            log.error("语音上传失败 userId={}", userId, e);
            String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "语音上传失败，请稍后重试";
            if (msg.length() > 80) msg = msg.substring(0, 80) + "…";
            return Result.error(500, "VOICE_UPLOAD_FAILED", msg);
        }
    }

    @RequestMapping("/deleteVoice")
    public Result<Boolean> deleteVoice(@RequestParam("memoId") Integer memoId) {
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/updateVoice")
    public Result<Boolean> updateVoice(@RequestParam("memoId") Integer memoId,
                                       @RequestParam("userId") Integer userId,
                                       @RequestParam(value = "title", required = false) String title,
                                       @RequestParam("file") MultipartFile file) {
        String voiceUrl = aliOssUtil.uploadVoice(userId, file);
        String saveTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : "语音记录";
        Boolean success = memoService.updateVoiceMemo(memoId, saveTitle, voiceUrl, null);
        return Result.success(success);
    }

    @RequestMapping("/getVoiceByUserId")
    public Result<List<Voice>> getVoiceByUserId(@RequestParam("userId") Integer userId) {
        List<Voice> voiceList = memoService.getVoiceByUserId(userId);
        return Result.success(voiceList);
    }

    // ========== 文件记录 ==========
    @RequestMapping("/addFile")
    public Result<Integer> addFile(@RequestParam(value = "userId", required = false) Integer userId,
                                   @RequestParam(value = "title", required = false) String title,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam(value = "mood", required = false) String mood,
                                   @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                   @RequestParam(value = "visibleTo", required = false) String visibleTo,
                                   @RequestParam(value = "category", required = false) String category) {
        if (userId == null) {
            return Result.error("缺少 userId");
        }
        if (file == null || file.isEmpty()) {
            return Result.error("请选择要上传的文件");
        }
        try {
            String fileUrl = aliOssUtil.uploadFile(userId, file);
            String lastMenstrualDate = getLastMenstrualDate(userId);
            String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);
            if (title == null || title.trim().isEmpty()) {
                try {
                    String promptKey = isSpouseUser(userId) ? "memo_file_title_dad" : "memo_file_title";
                    String promptStr = promptService.getUserPrompt(promptKey, "default",
                            java.util.Map.of("fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : ""));
                    if (promptStr == null || promptStr.isBlank()) promptStr = "请为上传的孕期文件生成一个简洁的标题（不超过20字），文件名：" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
                    String aiTitle = chatClient.prompt().user(promptStr).call().content();
                    if (aiTitle != null && !aiTitle.trim().isEmpty()) title = aiTitle.trim();
                } catch (Exception e) {
                    log.warn("文件标题 AI 生成失败，使用文件名", e);
                }
                if (title == null || title.trim().isEmpty()) {
                    String fn = file.getOriginalFilename();
                    title = (fn != null && !fn.isBlank()) ? fn : "文件";
                    if (title.length() > 20) title = title.substring(0, 20);
                }
            }
            String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
            String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);
            Integer memoId = memoService.addFileMemo(userId, title, fileUrl, pregnancyWeek, mood, mode, finalVisibleTo, category);
            mentionMailService.notifySpouseNewRecordAsync(userId, memoId, "file", title, null);
            String fn = file.getOriginalFilename();
            final String embedFileUrl = fileUrl;
            if (fn != null && fn.toLowerCase().endsWith(".pdf")) {
                final int uid = userId;
                final int mid = memoId;
                byte[] pdfBytes;
                try {
                    pdfBytes = file.getInputStream().readAllBytes();
                } catch (Exception e) {
                    log.warn("PDF 读取失败 memoId={}", memoId, e);
                    pdfBytes = null;
                }
                if (pdfBytes != null && pdfBytes.length > 0) {
                    final byte[] bytesToExtract = pdfBytes;
                    CompletableFuture.runAsync(() -> {
                        try {
                            String extracted = extractPdfTextFromBytes(bytesToExtract);
                            if (extracted != null && !extracted.isBlank()) {
                                String withUrl = embedFileUrl != null && !embedFileUrl.isBlank()
                                        ? extracted + "\n[URL] " + embedFileUrl : extracted;
                                ragService.embedAsync(uid, withUrl, "memo", String.valueOf(mid));
                            }
                        } catch (Exception e) {
                            log.warn("PDF 文字提取或嵌入失败 memoId={}", mid, e);
                        }
                    });
                }
            } else {
                String fileText = (title != null && !title.isBlank() ? title : "文件");
                if (embedFileUrl != null && !embedFileUrl.isBlank()) {
                    ragService.embedAsync(userId, fileText + "\n[URL] " + embedFileUrl, "memo", String.valueOf(memoId));
                }
            }
            return Result.success(memoId);
        } catch (Exception e) {
            log.error("文件上传失败 userId={} fileName={}", userId, file.getOriginalFilename(), e);
            String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "文件上传失败，请稍后重试";
            if (msg.length() > 80) msg = msg.substring(0, 80) + "…";
            return Result.error(500, "FILE_UPLOAD_FAILED", msg);
        }
    }

    private String extractPdfTextFromBytes(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) return "";
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            log.warn("PDF 正文抽取失败", e);
            return "";
        }
    }

    @RequestMapping("/deleteFile")
    public Result<Boolean> deleteFile(@RequestParam("memoId") Integer memoId) {
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/updateFile")
    public Result<Boolean> updateFile(@RequestParam("memoId") Integer memoId,
                                      @RequestParam(value = "title", required = false) String title,
                                      @RequestParam("file") MultipartFile file,
                                      @RequestParam("userId") Integer userId) {
        String fileUrl = aliOssUtil.uploadFile(userId, file);
        Boolean success = memoService.updateFileMemo(memoId, title, fileUrl);
        return Result.success(success);
    }

    // ========== 照片记录 ==========
    @RequestMapping("/addPhoto")
    public Result<Integer> addPhoto(@RequestParam("userId") Integer userId,
                                    @RequestParam("files") List<MultipartFile> files,
                                    @RequestParam(value = "title", required = false) String title,
                                    @RequestParam(value = "photoDescription", required = false) String photoDescription,
                                    @RequestParam(value = "mood", required = false) String mood,
                                    @RequestParam(value = "visibilityMode", required = false) String visibilityMode,
                                    @RequestParam(value = "visibleTo", required = false) String visibleTo,
                                    @RequestParam(value = "category", required = false) String category) {
        if (files.size() > 9) {
            return Result.error("最多只能上传9张照片");
        }
        List<String> photoUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            photoUrls.add(aliOssUtil.uploadPhoto(userId, file));
        }
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);
        String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : (visibleTo != null && !visibleTo.isBlank() ? "allowlist" : "all");
        String finalVisibleTo = validateAndNormalizeVisibleTo(userId, mode, visibleTo);
        Integer memoId = memoService.addPhotoMemo(userId, photoUrls, title, photoDescription, pregnancyWeek, mood, mode, finalVisibleTo, category);
        // 提及家庭成员时异步发邮件（检测 photoDescription）
        String desc = photoDescription != null ? photoDescription : "";
        mentionMailService.notifyMentionedMembersAsync(userId, memoId, "photo", title != null ? title : "照片记录", desc);
        mentionMailService.notifySpouseNewRecordAsync(userId, memoId, "photo", title != null ? title : "照片记录", desc);
        // RAG：后台异步调用图片理解模型，构造「图片理解+用户描述」再嵌入，与保存成功返回解耦
        if (!photoUrls.isEmpty()) {
            final int uid = userId;
            final int mid = memoId;
            final String firstUrl = photoUrls.get(0);
            final String userDesc = photoDescription != null ? photoDescription : "";
            CompletableFuture.runAsync(() -> {
                try {
                    String modelDesc = imageUnderstandingService.understandImage(firstUrl, "");
                    String toEmbed = "这是用户上传的图片，文字描述为{" + (modelDesc != null ? modelDesc : "") + "}，用户输入的文字描述为{" + userDesc + "}";
                    if (firstUrl != null && !firstUrl.isBlank()) {
                        toEmbed = toEmbed + "\n[URL] " + firstUrl;
                    }
                    ragService.embedAsync(uid, toEmbed, "image_desc", String.valueOf(mid));
                } catch (Exception e) {
                    log.warn("图片理解或嵌入失败 memoId={}", mid, e);
                }
            });
        }
        return Result.success(memoId);
    }

    @RequestMapping("/deletePhoto")
    public Result<Boolean> deletePhoto(@RequestParam("memoId") Integer memoId) {
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/updatePhoto")
    public Result<Boolean> updatePhoto(@RequestParam("memoId") Integer memoId,
                                       @RequestParam("userId") Integer userId,
                                       @RequestParam(value = "files", required = false) List<MultipartFile> files,
                                       @RequestParam(value = "photoDescription", required = false) String photoDescription) {
        if (files != null && files.size() > 9) {
            return Result.error("最多只能上传9张照片");
        }
        List<String> photoUrls = new ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                photoUrls.add(aliOssUtil.uploadPhoto(userId, file));
            }
        }
        Boolean success = memoService.updatePhotoMemo(memoId, photoUrls, photoDescription);
        return Result.success(success);
    }

    @RequestMapping("/getPhotoByUserId")
    public Result<List<Photo>> getPhotoByUserId(@RequestParam("userId") Integer userId) {
        List<Photo> photoList = memoService.getPhotoByUserId(userId);
        return Result.success(photoList);
    }

    @RequestMapping("/getFileByUserId")
    public Result<List<File>> getFileByUserId(@RequestParam("userId") Integer userId) {
        List<File> fileList = memoService.getFileByUserId(userId);
        return Result.success(fileList);
    }

    /** 按 ID 获取单条记录详情（含权限校验），用于详情页在列表中未命中时的回退请求。 */
    @RequestMapping("/getById")
    public Result<Map<String, Object>> getMemoById(@RequestParam("memoId") Integer memoId,
                                                   @RequestParam("requestUserId") Integer requestUserId) {
        Memo memo = memoService.getMemoByIdIfVisible(memoId, requestUserId);
        if (memo == null) {
            return Result.error(404, "NOT_FOUND", "记录不存在或已删除");
        }
        Map<String, Object> out = new HashMap<>();
        out.put("memoId", memo.getMemoId());
        out.put("userId", memo.getUserId());
        out.put("type", memo.getType());
        out.put("tag", memo.getTag());
        out.put("createdAt", memo.getCreatedAt());
        out.put("pregnancyWeek", memo.getPregnancyWeek());
        out.put("pregnancyWeekIndex", memo.getPregnancyWeekIndex());
        out.put("recordWeightKg", memo.getRecordWeightKg());
        out.put("mood", memo.getMood());
        out.put("category", memo.getCategory());
        out.put("photoDescription", memo.getPhotoDescription());
        out.put("visibilityMode", memo.getVisibilityMode());
        out.put("visibleTo", memo.getVisibleTo());
        String recordBy = null;
        com.anmory.yunji.entity.Family family = familyService.getMyFamily(requestUserId);
        if (family != null && family.getCreatorUserId() != null) {
            if (memo.getUserId().equals(family.getCreatorUserId())) recordBy = "mom";
            else {
                List<Integer> spouseIds = familyService.getSpouseUserIds(family.getCreatorUserId());
                if (spouseIds != null && spouseIds.contains(memo.getUserId())) recordBy = "dad";
            }
        }
        out.put("recordBy", recordBy);
        if ("text".equals(memo.getType())) {
            Text text = textMapper.selectByMemoId(memoId);
            if (text != null) {
                out.put("title", text.getTitle());
                out.put("content", text.getContent());
                out.put("textId", text.getTextId());
            }
        } else if ("voice".equals(memo.getType())) {
            List<Voice> voices = memoService.getVoiceByUserId(memo.getUserId());
            Voice voice = voices != null ? voices.stream().filter(v -> memoId.equals(v.getMemoId())).findFirst().orElse(null) : null;
            if (voice != null) {
                out.put("title", voice.getTitle());
                out.put("voiceUrl", voice.getUrl());
                out.put("voiceId", voice.getVoiceId());
            }
        } else if ("photo".equals(memo.getType())) {
            List<Photo> photos = memoService.getPhotoByUserId(memo.getUserId());
            List<String> urls = photos != null ? photos.stream().filter(p -> memoId.equals(p.getMemoId())).map(Photo::getUrl).collect(Collectors.toList()) : List.of();
            out.put("photoUrls", urls);
        } else if ("file".equals(memo.getType())) {
            List<File> files = memoService.getFileByUserId(memo.getUserId());
            File file = files != null ? files.stream().filter(f -> memoId.equals(f.getMemoId())).findFirst().orElse(null) : null;
            if (file != null) {
                out.put("title", file.getTitle());
                out.put("fileUrl", file.getUrl());
                out.put("fileId", file.getFileId());
            }
        }
        return Result.success(out);
    }

    // ========== 所有记录 ==========
    /** 家庭记录：一次返回妈妈+爸爸的可见记录，用于时间轴分栏与筛选。返回 mom / dad 两个列表，前端合并并加 recordBy。 */
    @RequestMapping("/getFamilyEnriched")
    public Result<java.util.Map<String, List<Memo>>> getFamilyEnriched(@RequestParam("requestUserId") Integer requestUserId) {
        com.anmory.yunji.entity.Family family = familyService.getMyFamily(requestUserId);
        if (family == null || family.getCreatorUserId() == null) {
            return Result.success(java.util.Map.of("mom", List.<Memo>of(), "dad", List.<Memo>of()));
        }
        Integer creatorUserId = family.getCreatorUserId();
        List<Memo> momList = memoService.getAllMemoByUserIdPaged(creatorUserId, requestUserId, 10000, 0);
        List<Integer> spouseIds = familyService.getSpouseUserIds(creatorUserId);
        if (spouseIds == null || spouseIds.isEmpty()) {
            return Result.success(java.util.Map.of("mom", momList != null ? momList : List.of(), "dad", List.<Memo>of()));
        }
        Integer spouseUserId = spouseIds.get(0);
        List<Memo> dadList = memoService.getAllMemoByUserIdPaged(spouseUserId, requestUserId, 10000, 0);
        return Result.success(java.util.Map.of(
                "mom", momList != null ? momList : List.of(),
                "dad", dadList != null ? dadList : List.of()));
    }

    @RequestMapping("/getAllByUserId")
    public Result<List<Memo>> getAllByUserId(@RequestParam("userId") Integer userId,
                                            @RequestParam(value = "requestUserId", required = false) Integer requestUserId,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int pageSize) {
        log.info("[可见范围] getAllByUserId 请求 userId={} requestUserId={} page={} pageSize={}", userId, requestUserId, page, pageSize);
        int offset = (page - 1) * pageSize;
        Integer viewer = requestUserId != null ? requestUserId : userId;
        List<Memo> allMemo = memoService.getAllMemoByUserIdPaged(userId, viewer, pageSize, offset);
        log.info("[可见范围] getAllByUserId 返回 {} 条记录", allMemo != null ? allMemo.size() : 0);
        return Result.success(allMemo);
    }

    // ========== PDF 导出 ==========
    @RequestMapping("/exportPdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam("userId") Integer userId,
                                           @RequestParam("username") String username) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        pdfExportService.exportToPdf(userId, username, out);
        byte[] bytes = out.toByteArray();
        String filename = "孕期记录-" + username + "-" + java.time.LocalDate.now() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(filename, StandardCharsets.UTF_8))
                .body(bytes);
    }

    @RequestMapping("/exportDateRangePdf")
    public ResponseEntity<byte[]> exportDateRangePdf(@RequestParam("userId") Integer userId,
                                                    @RequestParam("fromDate") String fromDateStr,
                                                    @RequestParam("toDate") String toDateStr,
                                                    @RequestParam("username") String username) {
        LocalDate fromDate = LocalDate.parse(fromDateStr);
        LocalDate toDate = LocalDate.parse(toDateStr);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        pdfExportService.exportDateRangePdf(userId, fromDate, toDate, username, out);
        byte[] bytes = out.toByteArray();
        String filename = "孕期记录-" + username + "-" + fromDateStr + "-" + toDateStr + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(filename, StandardCharsets.UTF_8))
                .body(bytes);
    }

    /** 导出 PDF 并异步发邮件，立即返回 202；失败时发站内通知 */
    @PostMapping("/exportPdfToEmail")
    public ResponseEntity<Result<Void>> exportPdfToEmail(@RequestParam("userId") Integer userId,
                                                         @RequestParam(value = "email", required = false) String emailParam,
                                                         @RequestParam(value = "scope", defaultValue = "both") String scope,
                                                         @RequestParam(value = "fromDate", required = false) String fromDateStr,
                                                         @RequestParam(value = "toDate", required = false) String toDateStr) {
        User user = userService.getById(userId);
        if (user == null) {
            return ResponseEntity.badRequest().body(Result.error("用户不存在"));
        }
        String toEmail = (emailParam != null && !emailParam.isBlank()) ? emailParam.trim() : (user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail().trim() : null);
        if (toEmail == null || !toEmail.contains("@")) {
            userNotificationService.notifySystem(userId, "导出失败", "请先设置邮箱后再导出 PDF。");
            return ResponseEntity.badRequest().body(Result.error("请先设置邮箱"));
        }
        LocalDate fromDate = null;
        LocalDate toDate = null;
        if (fromDateStr != null && !fromDateStr.isBlank()) {
            try { fromDate = LocalDate.parse(fromDateStr); } catch (Exception ignored) {}
        }
        if (toDateStr != null && !toDateStr.isBlank()) {
            try { toDate = LocalDate.parse(toDateStr); } catch (Exception ignored) {}
        }
        final String to = toEmail;
        final String scopeFinal = "mom".equals(scope) || "dad".equals(scope) ? scope : "both";
        final LocalDate from = fromDate;
        final LocalDate toDateLimit = toDate;
        CompletableFuture.runAsync(() -> {
            try {
                List<EnrichedMemoItem> items = new ArrayList<>();
                String pdfUsername = user.getUsername() != null ? user.getUsername() : "用户";
                com.anmory.yunji.entity.Family family = familyService.getMyFamily(userId);
                Integer creatorUserId = (family != null && family.getCreatorUserId() != null) ? family.getCreatorUserId() : userId;
                List<Integer> spouseIds = family != null ? familyService.getSpouseUserIds(creatorUserId) : List.of();
                Integer spouseUserId = (spouseIds != null && !spouseIds.isEmpty()) ? spouseIds.get(0) : null;
                if ("mom".equals(scopeFinal) || "both".equals(scopeFinal)) {
                    List<EnrichedMemoItem> momItems = pdfExportService.loadEnrichedItems(creatorUserId);
                    momItems.forEach(i -> i.setRecordBy("mom"));
                    items.addAll(momItems);
                }
                if ("dad".equals(scopeFinal) || "both".equals(scopeFinal)) {
                    if (spouseUserId != null) {
                        List<EnrichedMemoItem> dadItems = pdfExportService.loadEnrichedItems(spouseUserId);
                        dadItems.forEach(i -> i.setRecordBy("dad"));
                        items.addAll(dadItems);
                    }
                }
                items.sort((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                });
                if (from != null || toDateLimit != null) {
                    items = items.stream().filter(item -> {
                        if (item.getCreatedAt() == null) return false;
                        LocalDate d = item.getCreatedAt().toLocalDate();
                        if (from != null && d.isBefore(from)) return false;
                        if (toDateLimit != null && d.isAfter(toDateLimit)) return false;
                        return true;
                    }).collect(java.util.stream.Collectors.toList());
                }
                if (items.isEmpty()) {
                    pdfUsername = pdfUsername + "-空";
                }
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                pdfExportService.exportToPdf(items, pdfUsername, baos);
                byte[] pdfBytes = baos.toByteArray();
                String pdfUrl = aliOssUtil.uploadExportPdf(userId, pdfBytes);
                String htmlContent = com.anmory.yunji.service.impl.MailServiceImpl.wrapHtmlBody(
                    "<p style=\"margin:0 0 16px;font-size:15px;\">您的孕期记录 PDF 已生成。</p>"
                    + "<p style=\"margin:0 0 16px;font-size:15px;\"><a href=\"" + pdfUrl + "\" style=\"color:#c86b5a;text-decoration:underline;\">点击此处下载 PDF</a></p>"
                    + "<p style=\"margin:0;font-size:13px;color:#787673;\">链接 7 天内有效，请及时保存。</p>"
                );
                mailService.sendHtmlMail(to, "您的孕期记录 PDF 已生成", htmlContent);
                log.info("[导出] PDF 已上传 OSS 并发邮件链接 userId={} to={}", userId, to);
            } catch (Exception e) {
                log.warn("[导出] PDF 导出或发邮件失败 userId={}", userId, e);
                userNotificationService.notifySystem(userId, "导出失败", "孕期记录 PDF 导出失败，请稍后重试。");
            }
        });
        return ResponseEntity.status(org.springframework.http.HttpStatus.ACCEPTED).body(Result.success(null));
    }
}