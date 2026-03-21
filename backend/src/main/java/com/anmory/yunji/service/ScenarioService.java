package com.anmory.yunji.service;

import com.anmory.yunji.entity.Scenario;

import java.util.List;

/**
 * 情景演绎 - 情景模板
 */
public interface ScenarioService {

    /** 列出所有情景（仅配偶可调；若表为空则先写入内置数据） */
    List<Scenario> listForSpouse(Integer spouseUserId);

    Scenario getById(Integer scenarioId);
}
