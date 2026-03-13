package com.anmory.yunji.service.impl;

import com.anmory.yunji.common.RagService;
import com.anmory.yunji.entity.CheckReport;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.CheckReportMapper;
import com.anmory.yunji.service.CheckReportService;
import com.anmory.yunji.service.MailService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserService;
import com.anmory.yunji.utils.AliOssUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckReportServiceImpl implements CheckReportService {

    private final CheckReportMapper checkReportMapper;
    private final UserService userService;
    private final AliOssUtil aliOssUtil;
    private final OpenAiChatModel openAiChatModel;
    private final ObjectMapper objectMapper;
    private final MailService mailService;
    private final PromptService promptService;
    private final RagService ragService;

    @Value("${check-report.max-retry:3}")
    private Integer maxRetry;

    @Override
    public CheckReport uploadAndParse(Integer userId, MultipartFile file, String extraText) {
        String fileUrl = aliOssUtil.uploadFile(userId, file);
        String extractedPdfText = extractPdfTextIfApplicable(file);
        AiParseResult parsed = parseByAi(file.getOriginalFilename(), fileUrl, extraText, extractedPdfText);

        CheckReport report = new CheckReport();
        report.setUserId(userId);
        report.setFileUrl(fileUrl);
        report.setOriginalFilename(file.getOriginalFilename());
        report.setParsedSummary(parsed.summary());
        report.setNextCheckDate(parsed.nextCheckDate());
        report.setEmailSent(false);
        report.setSendStatus("pending");
        report.setRetryCount(0);
        checkReportMapper.insert(report);
        if (extractedPdfText != null && !extractedPdfText.isBlank() && report.getReportId() != null) {
            ragService.embedAsync(userId, extractedPdfText, "pdf", String.valueOf(report.getReportId()));
        }
        return report;
    }

    @Override
    public List<CheckReport> listByUserId(Integer userId) {
        return checkReportMapper.listByUserId(userId);
    }

    @Override
    public void processScheduledReminders() {
        LocalDate today = LocalDate.now();
        List<CheckReport> dueReports = checkReportMapper.listPendingToSend(today, maxRetry);
        for (CheckReport report : dueReports) {
            try {
                User user = userService.getById(report.getUserId());
                if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                    checkReportMapper.updateSendStatus(report.getReportId(), false, "failed", report.getRetryCount() + 1);
                    continue;
                }
                String subject = "孕期检查提醒";
                String content = buildMailContent(report);
                mailService.sendTextMail(user.getEmail(), subject, content);
                checkReportMapper.updateSendStatus(report.getReportId(), true, "sent", report.getRetryCount());
            } catch (Exception ex) {
                log.warn("检查提醒发送失败 reportId={}", report.getReportId(), ex);
                checkReportMapper.updateSendStatus(report.getReportId(), false, "failed", report.getRetryCount() + 1);
            }
        }
    }

    private String buildMailContent(CheckReport report) {
        return "您好，您有一条待复查提醒。\n\n" +
                "建议复查日期：" + report.getNextCheckDate() + "\n" +
                "检查单摘要：" + (report.getParsedSummary() == null ? "（未解析）" : report.getParsedSummary()) + "\n\n" +
                "请按时复查，祝您和宝宝健康平安。";
    }

    private String extractPdfTextIfApplicable(MultipartFile file) {
        if (file == null || file.getOriginalFilename() == null) return "";
        if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) return "";
        try (InputStream is = file.getInputStream();
             PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            log.warn("PDF 正文抽取失败", e);
            return "";
        }
    }

    private AiParseResult parseByAi(String filename, String fileUrl, String extraText, String extractedPdfText) {
        try {
            String systemPrompt = promptService.getSystemPrompt("check_report_extract", "default");
            if (systemPrompt == null) systemPrompt = "你是产检提醒提取助手。根据给定信息提取建议复查日期。";
            String userPrompt = promptService.getUserPrompt("check_report_extract", "default",
                    java.util.Map.of("filename", filename != null ? filename : "",
                            "fileUrl", fileUrl != null ? fileUrl : "",
                            "extraText", extraText != null ? extraText : "",
                            "extractedPdfText", extractedPdfText != null ? extractedPdfText : ""));
            if (userPrompt == null || userPrompt.isBlank()) {
                userPrompt = "文件名: " + (filename == null ? "" : filename) + "\n文件URL: " + fileUrl
                        + "\n用户补充内容: " + (extraText == null ? "" : extraText)
                        + (extractedPdfText != null && !extractedPdfText.isBlank()
                        ? "\n\nPDF 正文抽取内容：\n" + extractedPdfText.substring(0, Math.min(extractedPdfText.length(), 8000))
                        : "")
                        + "\n\n请仅输出 JSON，不要其他文字。格式：{\"summary\":\"...\",\"nextCheckDate\":\"yyyy-MM-dd 或 null\"}";
            }
            String content = ChatClient.builder(openAiChatModel)
                    .defaultSystem(systemPrompt)
                    .build()
                    .prompt()
                    .user(userPrompt)
                    .call()
                    .content();
            JsonNode node = objectMapper.readTree(content);
            String summary = node.path("summary").asText("");
            String nextDateText = node.path("nextCheckDate").asText("");
            LocalDate nextDate = null;
            if (!nextDateText.isBlank() && !"null".equalsIgnoreCase(nextDateText)) {
                nextDate = LocalDate.parse(nextDateText);
            }
            if (nextDate == null) {
                nextDate = LocalDate.now().plusWeeks(4);
            }
            return new AiParseResult(summary, nextDate);
        } catch (Exception ex) {
            log.warn("AI解析检查单失败，使用兜底日期", ex);
            return new AiParseResult("检查单已上传，建议关注下次产检时间。", LocalDate.now().plusWeeks(4));
        }
    }

    private record AiParseResult(String summary, LocalDate nextCheckDate) {
    }
}

