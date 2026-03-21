package com.anmory.yunji.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class DeepSeekUtil {


    @Value("${deepseek.api-key}")
    private String apiKey;


    @Value("${deepseek.base-url}")
    private String apiUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 基于内容生成标题（用于文字/照片/文件记录）
     */
    public String generateTitleByContent(String content) {
        if (content == null || content.isEmpty()) {
            content = "孕期日常记录";
        }
        String prompt = "请为以下孕期记录生成一个简洁的标题（不超过20个字）：" + content;
        return callDeepSeekApi(prompt);
    }

    /**
     * 基于文件名生成标题（用于文件记录）
     */
    public String generateTitleByFileName(String fileName) {
        String prompt = "请为以下孕期文件生成一个简洁的标题（不超过20个字）：" + fileName;
        return callDeepSeekApi(prompt);
    }

    /**
     * 语音转文字（调用DeepSeek的语音转文字能力）
     */
    public String convertVoiceToText(String voiceUrl) {
        String prompt = "请将以下语音URL的内容转换为文字：" + voiceUrl;
        try {
            String text = callDeepSeekApi(prompt);
            return text == null || text.isEmpty() ? "" : text;
        } catch (Exception e) {
            log.error("语音转文字失败", e);
            return "";
        }
    }

    /**
     * 通用调用DeepSeek API的方法
     */
    private String callDeepSeekApi(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "deepseek-chat"); // 根据实际模型调整
            requestBody.put("messages", new Object[]{
                    Map.of("role", "user", "content", prompt)
            });
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 200);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("choices")) {
                    Map<String, Object> choice = (Map<String, Object>) ((List<?>) responseBody.get("choices")).get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("调用DeepSeek API失败", e);
        }
        return "默认标题"; // 降级处理
    }
}