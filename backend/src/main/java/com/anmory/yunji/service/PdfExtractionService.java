package com.anmory.yunji.service;

import java.util.List;

/**
 * PDF 抽取服务：保留表格结构的文本抽取 + 图片提取。
 * 用于产检报告、B超单等表格型 PDF 的 AI 解析。
 */
public interface PdfExtractionService {

    /**
     * 抽取 PDF 文本，保留表格布局（制表符分隔行列）。
     * 若为扫描件（无文本层），返回空或过短字符串。
     *
     * @param pdfBytes PDF 字节数组
     * @return 结构化文本，失败返回空字符串
     */
    String extractWithStructure(byte[] pdfBytes);

    /**
     * 从 PDF 中提取所有页面的内嵌图片。
     *
     * @param pdfBytes PDF 字节数组
     * @return 图片字节数组列表，每项为 [pageIndex, imageBytes]
     */
    List<ExtractedImage> extractImages(byte[] pdfBytes);

    /**
     * 抽取结果：优先布局保留文本；若文本不足则尝试图片提取。
     * 用于 B超/产检等场景，供 AI 解析。
     *
     * @param pdfBytes PDF 字节数组
     * @return 抽取结果，含文本与图片 URL 列表
     */
    ExtractionResult extractForAnalysis(byte[] pdfBytes, Integer userId);

    record ExtractedImage(int pageIndex, byte[] imageBytes, String suggestedSuffix) {}

    record ExtractionResult(String text, List<String> imageUrls, boolean isLikelyScanned) {}
}
