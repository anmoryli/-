package com.anmory.yunji.dto;

import lombok.Data;

import java.util.List;

/**
 * 妈妈端：情绪-孕周汇总 + 温暖解读
 */
@Data
public class EmotionPregnancySummaryDto {
    private List<EmotionWeekDto> weeks;
    private String warmSentence;
    private String weightInRangeHint;
}
