package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Scenario;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ScenarioMapper {

    @Select("SELECT scenario_id, title, description, sort_order, opening_prompt_key, end_trigger_hint, created_at, updated_at " +
            "FROM yunfu.scenario ORDER BY sort_order ASC, scenario_id ASC")
    @Results(id = "scenarioMap", value = {
            @Result(column = "scenario_id", property = "scenarioId"),
            @Result(column = "opening_prompt_key", property = "openingPromptKey"),
            @Result(column = "sort_order", property = "sortOrder"),
            @Result(column = "end_trigger_hint", property = "endTriggerHint"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Scenario> selectAll();

    @Select("SELECT scenario_id, title, description, sort_order, opening_prompt_key, end_trigger_hint, created_at, updated_at " +
            "FROM yunfu.scenario WHERE scenario_id = #{scenarioId}")
    @ResultMap("scenarioMap")
    Scenario selectById(@Param("scenarioId") Integer scenarioId);

    @Insert("INSERT INTO yunfu.scenario (title, description, sort_order, opening_prompt_key, end_trigger_hint, created_at, updated_at) " +
            "VALUES (#{title}, #{description}, #{sortOrder}, #{openingPromptKey}, #{endTriggerHint}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "scenarioId")
    int insert(Scenario scenario);

    @Select("SELECT COUNT(*) FROM yunfu.scenario")
    int count();
}
