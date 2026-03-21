package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.PregnancyGoalTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PregnancyGoalTemplateMapper {

    @Select("SELECT template_id, category, track_key, name, description, target_value, unit, points, sort_order, created_at, updated_at " +
            "FROM pregnancy_goal_template ORDER BY sort_order ASC")
    List<PregnancyGoalTemplate> selectAll();
}
