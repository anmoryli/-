package com.anmory.yunji.service;

import com.anmory.yunji.dto.EnrichedMemoItem;

import java.io.OutputStream;
import java.time.LocalDate;
import java.util.List;

/**
 * PDF 导出服务：将用户所有记录导出为排版精美的 PDF
 */
public interface PdfExportService {

    /**
     * 导出用户所有记录为 PDF
     *
     * @param userId   用户 ID
     * @param username 用户名（用于封面）
     * @param output   PDF 输出流
     */
    void exportToPdf(Integer userId, String username, OutputStream output);

    /**
     * 导出用户指定日期范围内的记录为 PDF
     *
     * @param userId   用户 ID
     * @param fromDate 起始日期（含）
     * @param toDate   截止日期（含）
     * @param username 用户名（用于封面）
     * @param output   PDF 输出流
     */
    void exportDateRangePdf(Integer userId, LocalDate fromDate, LocalDate toDate, String username, OutputStream output);

    /**
     * 将合并后的记录列表导出为 PDF（用于已有数据直接导出）
     */
    void exportToPdf(List<EnrichedMemoItem> items, String username, OutputStream output);

    /**
     * 加载指定用户的记录并转为 EnrichedMemoItem 列表（用于按 scope 导出）
     */
    List<EnrichedMemoItem> loadEnrichedItems(Integer userId);
}
