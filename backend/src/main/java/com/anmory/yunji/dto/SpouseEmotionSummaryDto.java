package com.anmory.yunji.dto;

import lombok.Data;

import java.util.List;

/**
 * 爸爸端：妻子情绪趋势轻量摘要（不包含具体日记）
 */
@Data
public class SpouseEmotionSummaryDto {
    /** stable | fluctuating | need_support */
    private String trend;
    /** 如 "孕12周：情绪平稳" */
    private List<String> lastWeeks;
    /** 可执行建议 */
    private String suggestedAction;
}
