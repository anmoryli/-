package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.FetalUltrasoundRecord;
import com.anmory.yunji.service.FetalPdfService;
import com.anmory.yunji.service.PdfExtractionService;
import com.anmory.yunji.service.PromptService;
import com.anmory.yunji.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FetalPdfServiceImpl implements FetalPdfService {

    private final PdfExtractionService pdfExtractionService;
    private final OpenAiChatModel openAiChatModel;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    @Override
    public FetalUltrasoundRecord parseOnly(Integer userId, MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        String fn = file.getOriginalFilename();
        String ct = file.getContentType();
        boolean isPdf = (fn != null && fn.toLowerCase().endsWith(".pdf")) || "application/pdf".equalsIgnoreCase(ct != null ? ct : "");
        if (!isPdf) {
            log.warn("[B超PDF] 非 PDF 文件，跳过 fn={} ct={}", fn, ct);
            return null;
        }
        try {
            byte[] pdfBytes = file.getBytes();
            if (pdfBytes == null || pdfBytes.length == 0) return null;

            PdfExtractionService.ExtractionResult extraction = pdfExtractionService.extractForAnalysis(pdfBytes, userId);
            String textForAi = extraction.text();
            List<String> imageUrls = extraction.imageUrls() != null ? extraction.imageUrls() : List.of();
            String imageUrlsStr = imageUrls.isEmpty() ? "无" : String.join("\n", imageUrls);

            FetalUltrasoundRecord record = parseByAi(userId, textForAi, imageUrlsStr);
            if (record == null) {
                log.warn("[B超PDF] AI 解析失败，无法提取指标");
                return null;
            }

            if (record.getRecordDate() == null) {
                record.setRecordDate(LocalDate.now());
            }
            Integer week = resolveGestationWeek(userId, record.getRecordDate(), record.getGestationWeek());
            record.setGestationWeek(week);
            log.info("[B超PDF] 解析完成（仅解析不保存）gestationWeek={} bpd={} hc={} ac={} fl={} efw={}",
                    record.getGestationWeek(), record.getBpdMm(), record.getHcMm(), record.getAcMm(), record.getFlMm(), record.getEfwG());
            return record;
        } catch (Exception e) {
            log.error("[B超PDF] 解析失败 userId={}", userId, e);
            return null;
        }
    }

    private FetalUltrasoundRecord parseByAi(Integer userId, String extractedText, String imageUrls) {
        try {
            String systemPrompt = promptService.getSystemPrompt("b_ultrasound_extract", "default");
            if (systemPrompt == null) systemPrompt = "你是B超报告解析助手。根据PDF抽取内容提取胎儿B超指标。";
            String textForPrompt = extractedText != null ? extractedText.substring(0, Math.min(extractedText.length(), 12000)) : "";
            String userPrompt = promptService.getUserPrompt("b_ultrasound_extract", "default",
                    java.util.Map.of(
                            "extractedPdfText", textForPrompt,
                            "imageUrls", imageUrls != null ? imageUrls : ""
                    ));
            if (userPrompt == null || userPrompt.isBlank()) {
                userPrompt = "B超报告PDF抽取内容：\n\n" + textForPrompt + "\n\n若有图片URL（扫描件）：" + (imageUrls != null ? imageUrls : "无") + "\n\n请仅输出 JSON：{\"recordDate\":\"yyyy-MM-dd\",\"gestationWeek\":int,\"bpdMm\":float,\"hcMm\":float,\"acMm\":float,\"flMm\":float,\"efwG\":int,\"note\":\"...\"}";
            }

            String content = ChatClient.builder(openAiChatModel)
                    .defaultSystem(systemPrompt)
                    .build()
                    .prompt()
                    .user(userPrompt)
                    .call()
                    .content();

            if (content == null || content.isBlank()) return null;

            content = content.trim();
            if (content.startsWith("```")) {
                int start = content.indexOf("{");
                int end = content.lastIndexOf("}");
                if (start >= 0 && end > start) {
                    content = content.substring(start, end + 1);
                }
            }

            JsonNode node = objectMapper.readTree(content);
            FetalUltrasoundRecord r = new FetalUltrasoundRecord();
            String dateStr = node.path("recordDate").asText(null);
            if (dateStr != null && !dateStr.isBlank() && !"null".equalsIgnoreCase(dateStr)) {
                r.setRecordDate(LocalDate.parse(dateStr));
            }
            int gw = node.path("gestationWeek").asInt(0);
            r.setGestationWeek(gw > 0 ? gw : null);
            r.setBpdMm(parseDecimal(node.path("bpdMm")));
            r.setHcMm(parseDecimal(node.path("hcMm")));
            r.setAcMm(parseDecimal(node.path("acMm")));
            r.setFlMm(parseDecimal(node.path("flMm")));
            int efw = node.path("efwG").asInt(0);
            r.setEfwG(efw > 0 ? efw : null);
            String note = node.path("note").asText(null);
            r.setNote(note != null && !note.isBlank() && !"null".equalsIgnoreCase(note) ? note.trim() : null);
            return r;
        } catch (Exception ex) {
            log.warn("[B超PDF] AI 解析异常", ex);
            return null;
        }
    }

    private static BigDecimal parseDecimal(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isNumber()) return BigDecimal.valueOf(node.asDouble()).setScale(2, RoundingMode.HALF_UP);
        String s = node.asText(null);
        if (s == null || s.isBlank() || "null".equalsIgnoreCase(s)) return null;
        try {
            return new BigDecimal(s).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer resolveGestationWeek(Integer userId, LocalDate recordDate, Integer suppliedWeek) {
        if (suppliedWeek != null && suppliedWeek > 0 && suppliedWeek <= 45) return suppliedWeek;
        var user = userService.getById(userId);
        if (user == null) return null;
        if (user.getLastMenstrualDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(user.getLastMenstrualDate(), recordDate);
            if (days < 0) return null;
            return (int) (days / 7) + 1;
        }
        if (user.getPregnancyTime() != null) {
            long daysToDue = java.time.temporal.ChronoUnit.DAYS.between(recordDate, user.getPregnancyTime().toLocalDate());
            int week = 40 - (int) Math.floor(daysToDue / 7.0);
            if (week < 1 || week > 45) return null;
            return week;
        }
        return null;
    }
}
