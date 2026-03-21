package com.anmory.yunji.common;

import com.google.gson.*;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.annotation.Nullable;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RagService {

    private static final String BASE_URL = "http://42.192.61.108:8004";
    private static final OkHttpClient CLIENT = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .build();

    // 使用 Gson + 静态方法替代过时的 JsonParser
    private static final Gson GSON = new Gson();

    /** 检索相关上下文（仅政策/百科，不传用户） */
    public String getRelevant(String question) throws IOException {
        return getRelevant(question, null, true);
    }

    /** 检索相关上下文：传入 userId 时同时检索用户私有数据与百科；includeGlobal 是否包含百科 */
    public String getRelevant(String question, Integer userId, boolean includeGlobal) throws IOException {
        return getRelevant(question, userId, includeGlobal, 10);
    }

    /** 指定 top_k，便于首次检索就尽量命中用户要的内容 */
    public String getRelevant(String question, Integer userId, boolean includeGlobal, int topK) throws IOException {
        int k = topK > 0 && topK <= 20 ? topK : 10;
        StringBuilder url = new StringBuilder(BASE_URL).append("/api/v1/query?question=")
                .append(URLEncoder.encode(question, StandardCharsets.UTF_8))
                .append("&top_k=").append(k);
        if (userId != null && userId > 0) {
            url.append("&user_id=").append(userId).append("&include_global=").append(includeGlobal);
        }

        Request request = new Request.Builder().url(url.toString()).get().build();
        log.info("[RAG] 调用检索服务 questionLen={} userId={} topK={}", question != null ? question.length() : 0, userId, k);

        try (Response response = CLIENT.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.warn("RAG 接口调用失败，状态码: {}", response.code());
                return "抱歉，检索服务暂时不可用（HTTP " + response.code() + "）。";
            }

            String body = response.body().string();
            log.info("RAG 完整响应体: {}", body);

            // ---------- 安全解析 JSON（使用非过时 API） ----------
            JsonObject root;
            try {
                // 替代过时的 JSON_PARSER.parse(body)
                JsonElement parsed = JsonParser.parseString(body);
                if (!parsed.isJsonObject()) {
                    log.warn("RAG 返回体不是 JSON 对象");
                    return "检索服务异常（返回格式错误）";
                }
                root = parsed.getAsJsonObject();
            } catch (Exception e) {
                log.error("RAG 返回体无法解析为 JSON", e);
                return "检索服务异常（JSON 解析失败）";
            }

            if (!root.has("code") || root.get("code").getAsInt() != 200) {
                log.warn("RAG 返回 code 非 200");
                return "检索服务异常";
            }

            JsonObject data = root.getAsJsonObject("data");
            if (data == null || !data.has("hits")) {
                log.warn("RAG 返回缺少 data.hits 字段");
                return "未找到相关内容（接口结构异常）";
            }

            // ---------- 安全提取 hits 数组 ----------
            JsonArray hits = new JsonArray();
            try {
                JsonElement hitsElement = data.get("hits");
                if (hitsElement != null && hitsElement.isJsonArray()) {
                    hits = hitsElement.getAsJsonArray();
                }
            } catch (Exception e) {
                log.error("解析 hits 数组失败，可能是字段为 null 导致", e);
            }

            if (hits.size() == 0) {
                log.info("RAG 检索命中 0 条，问题：{}", question);
                return "根据您的提问，暂未找到直接匹配的政策内容。";
            }

            // ---------- 正常处理命中结果 ----------
            List<String> contexts = new ArrayList<>();
            int rank = 1;
            for (JsonElement elem : hits) {
                if (!elem.isJsonObject()) continue;

                JsonObject hit = elem.getAsJsonObject();

                String context = "（空内容）";
                if (hit.has("context") && !hit.get("context").isJsonNull()) {
                    context = hit.get("context").getAsString().trim();
                }

                double score = 0.0;
                if (hit.has("similarity_score") && !hit.get("similarity_score").isJsonNull()) {
                    score = hit.get("similarity_score").getAsDouble();
                }

                contexts.add("【相关片段 " + rank + "，相似度：" + String.format("%.4f", score) + "】\n" + context);
                log.info("RAG 命中第{}条，相似度: {}，长度: {}", rank, String.format("%.4f", score), context.length());
                rank++;
            }

            return String.join("\n\n========================================\n\n", contexts);

        } catch (Exception e) {
            log.error("RAG 调用出现未知异常", e);
            return "检索出现异常，请稍后重试。";
        }
    }

    public boolean triggerBuild() {
        String url = BASE_URL + "/api/v1/upload";
        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(null, new byte[0]))
                .build();

        try (Response response = CLIENT.newCall(request).execute()) {
            boolean ok = response.isSuccessful();
            log.info("向量库构建请求结果: {}", ok ? "成功" : "失败");
            return ok;
        } catch (Exception e) {
            log.error("向量库构建失败", e);
            return false;
        }
    }

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    /**
     * 异步向 RAG 写入一条文本（memo/消息/PDF/图片描述）。失败仅打日志。
     * @param userId 用户ID
     * @param text 文本内容
     * @param source memo | message | pdf | image_desc
     * @param sourceId 来源ID（如 memoId、messageId）
     */
    @Async
    public void embedAsync(int userId, String text, String source, @Nullable String sourceId) {
        if (text == null || text.isBlank()) return;
        String body = GSON.toJson(Map.of(
                "user_id", userId,
                "text", text.trim().length() > 10000 ? text.trim().substring(0, 10000) : text.trim(),
                "source", source != null ? source : "memo",
                "source_id", sourceId != null ? sourceId : ""
        ));
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/v1/embed")
                .post(RequestBody.create(body, JSON))
                .build();
        try (Response response = CLIENT.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.warn("RAG embed 失败 userId={} source={} code={}", userId, source, response.code());
            }
        } catch (Exception e) {
            log.warn("RAG embed 调用异常 userId={} source={}", userId, source, e);
        }
    }

    /**
     * 同步嵌入（供 EmbedTaskRunner 调度器使用，异常向上抛出）
     */
    public void embedSync(int userId, String text, String source, String sourceId) throws IOException {
        if (text == null || text.isBlank()) return;
        String body = GSON.toJson(Map.of(
                "user_id", userId,
                "text", text.trim().length() > 10000 ? text.trim().substring(0, 10000) : text.trim(),
                "source", source != null ? source : "memo",
                "source_id", sourceId != null ? sourceId : ""
        ));
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/v1/embed")
                .post(RequestBody.create(body, JSON))
                .build();
        try (Response response = CLIENT.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("RAG embed 失败 code=" + response.code());
            }
        }
    }

    /**
     * 按 source + source_id 删除向量库中的对应条目
     */
    public void deleteBySourceId(String source, String sourceId) throws IOException {
        String url = BASE_URL + "/api/v1/delete?source="
                + URLEncoder.encode(source != null ? source : "memo", StandardCharsets.UTF_8)
                + "&source_id=" + URLEncoder.encode(sourceId != null ? sourceId : "", StandardCharsets.UTF_8);
        Request request = new Request.Builder().url(url).delete().build();
        try (Response response = CLIENT.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("RAG delete 失败 code=" + response.code());
            }
        }
    }
}