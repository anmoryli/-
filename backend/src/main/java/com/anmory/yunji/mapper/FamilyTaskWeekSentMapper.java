package com.anmory.yunji.mapper;

import org.apache.ibatis.annotations.*;

@Mapper
public interface FamilyTaskWeekSentMapper {

    @Select("SELECT 1 FROM family_task_week_sent WHERE family_id = #{familyId} AND pregnancy_week = #{pregnancyWeek} LIMIT 1")
    Integer existsByFamilyAndWeek(@Param("familyId") Integer familyId, @Param("pregnancyWeek") int pregnancyWeek);

    @Insert("INSERT INTO family_task_week_sent (family_id, pregnancy_week) VALUES (#{familyId}, #{pregnancyWeek})")
    int insert(@Param("familyId") Integer familyId, @Param("pregnancyWeek") int pregnancyWeek);
}
