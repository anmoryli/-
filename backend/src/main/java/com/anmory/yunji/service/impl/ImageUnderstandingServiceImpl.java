package com.anmory.yunji.service.impl;

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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import com.anmory.yunji.service.ImageUnderstandingService;
import com.anmory.yunji.service.PromptService;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUnderstandingServiceImpl implements ImageUnderstandingService {

    private final ObjectMapper objectMapper;
    private final PromptService promptService;

    @Value("${spring.ai.openai.base-url}")
    private String aiBaseUrl;

    @Value("${spring.ai.openai.api-key}")
    private String aiApiKey;

    private static final String MODEL_TEXT_CHAT = "gpt-5.2";

    private static final OkHttpClient CLIENT = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(120, TimeUnit.SECONDS)
            .build();

    @Override
    public String understandImage(String imageUrl, String userQuestion) {
        if (imageUrl == null || imageUrl.isBlank()) return "";
        try {
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

            String base = aiBaseUrl != null && aiBaseUrl.endsWith("/") ? aiBaseUrl.substring(0, aiBaseUrl.length() - 1) : aiBaseUrl;
            String url = base + "/v1/chat/completions";
            String payload = objectMapper.writeValueAsString(body);
            RequestBody requestBody = RequestBody.create(payload, okhttp3.MediaType.parse("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(url)
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer " + (aiApiKey != null ? aiApiKey : ""))
                    .addHeader("Content-Type", "application/json; charset=utf-8")
                    .build();
            try (Response response = CLIENT.newCall(request).execute()) {
                String bodyText = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.warn("图片理解请求失败 code={} body={}", response.code(), bodyText);
                    return "";
                }
                JsonNode root = objectMapper.readTree(bodyText);
                return root.path("choices").path(0).path("message").path("content").asText("").trim();
            }
        } catch (Exception e) {
            log.warn("图片理解异常 imageUrl={}", imageUrl, e);
            return "";
        }
    }
}
