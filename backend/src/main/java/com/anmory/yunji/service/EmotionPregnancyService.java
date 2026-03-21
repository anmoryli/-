package com.anmory.yunji.service;

import com.anmory.yunji.dto.EmotionPregnancySummaryDto;
import com.anmory.yunji.dto.SpouseEmotionSummaryDto;

/**
 * 情绪-孕周聚合与温暖解读、配偶摘要
 */
public interface EmotionPregnancyService {

    /**
     * 妈妈端：按孕周聚合情绪与体重，返回曲线数据 + 温暖解读
     *
     * @param creatorUserId 孕妇（家庭创建者）userId
     * @return 周列表 + warmSentence + weightInRangeHint，无数据时返回空列表与默认话术
     */
    EmotionPregnancySummaryDto getSummary(Integer creatorUserId);

    /**
     * 爸爸端：妻子情绪趋势轻量摘要（不包含具体日记）
     *
     * @param spouseUserId 配偶（爸爸）userId，会反查其家庭的 creator 并聚合 creator 的数据
     * @return trend + lastWeeks 描述 + suggestedAction
     */
    SpouseEmotionSummaryDto getSpouseSummary(Integer spouseUserId);

    /**
     * 判断近几周情绪趋势：stable / fluctuating / need_support（供推送与爸爸端使用）
     */
    String computeTrend(Integer creatorUserId);

    /**
     * 获取上周（过去7天）简要摘要，用于本周提醒 AI 的上下文。
     *
     * @param userId 用户 ID（孕妇或记录主体）
     * @return 1～2 句摘要，如「上周记录3条，体重平稳，心情以开心为主」
     */
    String getLastWeekSummary(Integer userId);
}
