package com.anmory.yunji.dto;

import lombok.Data;

import java.util.Map;

/**
 * 单周情绪-孕周汇总（妈妈端曲线用）
 */
@Data
public class EmotionWeekDto {
    private Integer pregnancyWeekIndex;
    private String weekLabel;
    private Map<String, Integer> moodDistribution;
    private int recordCount;
    private Double avgWeightKg;
    private Boolean weightInRange;
}
