package com.anmory.yunji.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 合并后的记录项，用于 PDF 导出等
 */
@Data
public class EnrichedMemoItem {
    private Integer memoId;
    private String type; // text, voice, photo, file
    private LocalDateTime createdAt;
    private String pregnancyWeek;
    private Integer pregnancyWeekIndex;
    private Double weightKg;

    private String title;
    private String content;
    private String voiceUrl;
    private String textContent;
    private List<String> photoUrls;
    private String photoDescription;
    private String fileUrl;
    private String tag;
    private String mood;
    private Integer commentCount;
    /** 导出时区分记录者：mom=妈妈/创建者，dad=爸爸/配偶 */
    private String recordBy;
}
