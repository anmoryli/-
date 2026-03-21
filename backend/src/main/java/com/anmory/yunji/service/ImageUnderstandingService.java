package com.anmory.yunji.service;

/**
 * 调用图片理解模型对单张图片进行描述，用于 RAG 嵌入等场景。
 */
public interface ImageUnderstandingService {

    /**
     * 对给定图片 URL 进行理解，返回模型生成的文字描述。
     * @param imageUrl 图片可访问 URL（如 OSS 地址）
     * @param userQuestion 可选用户问题，为空时使用默认“请理解并描述”
     * @return 模型返回的描述文本，失败时返回 null 或空字符串
     */
    String understandImage(String imageUrl, String userQuestion);
}
