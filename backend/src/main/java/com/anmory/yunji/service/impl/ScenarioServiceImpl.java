package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Scenario;
import com.anmory.yunji.mapper.ScenarioMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.ScenarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScenarioServiceImpl implements ScenarioService {

    private final ScenarioMapper scenarioMapper;
    private final FamilyService familyService;

    @Override
    public List<Scenario> listForSpouse(Integer spouseUserId) {
        if (spouseUserId == null || !familyService.isSpouse(spouseUserId)) {
            return List.of();
        }
        ensureScenariosExist();
        return scenarioMapper.selectAll();
    }

    @Override
    public Scenario getById(Integer scenarioId) {
        if (scenarioId == null) return null;
        return scenarioMapper.selectById(scenarioId);
    }

    private void ensureScenariosExist() {
        if (scenarioMapper.count() > 0) return;
        List<Scenario> defaults = List.of(
                scenario("产检焦虑", "模拟产检前的紧张与担忧，练习如何安抚与陪伴", 1, "产检话题自然结束、情绪平复"),
                scenario("孕吐不适", "模拟孕吐或食欲不佳时的对话，练习关心与实用建议", 2, "孕吐/饮食话题告一段落"),
                scenario("情绪波动", "模拟孕期情绪低落或敏感时刻，练习共情与倾听", 3, "情绪得到疏导或话题转换"),
                scenario("胎动讨论", "模拟第一次胎动或日常胎动话题，练习分享喜悦", 4, "胎动话题自然结束"),
                scenario("睡前不适", "模拟睡前睡不着、抽筋等不适，练习安抚与陪伴", 5, "睡眠话题结束"),
                scenario("孕期饮食", "模拟对饮食禁忌、营养的疑问，练习理性建议", 6, "饮食建议已给、话题结束")
        );
        for (Scenario s : defaults) {
            scenarioMapper.insert(s);
        }
        log.info("[情景演绎] 已写入 {} 条内置情景", defaults.size());
    }

    private static Scenario scenario(String title, String description, int order, String endHint) {
        Scenario s = new Scenario();
        s.setTitle(title);
        s.setDescription(description);
        s.setSortOrder(order);
        s.setOpeningPromptKey("scenario_opening");
        s.setEndTriggerHint(endHint);
        return s;
    }
}
