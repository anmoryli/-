package com.anmory.yunji.service;

/**
 * 配偶判断服务：根据 relationship 异步判断家庭成员是否为配偶，写入 is_spouse
 */
public interface SpouseDetectionService {

    /**
     * 异步判断并更新 is_spouse（根据 relationship 调用 LLM）
     *
     * @param memberId 家庭成员 ID
     * @param relationship 与孕妇的关系描述（如老公、婆婆、妈妈）
     */
    void detectSpouseAsync(Integer memberId, String relationship);
}
