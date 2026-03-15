package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.ScenarioReport;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ScenarioReportMapper {

    @Insert("INSERT INTO yunfu.scenario_report (conversation_id, scenario_id, spouse_user_id, creator_user_id, content, created_at) " +
            "VALUES (#{conversationId}, #{scenarioId}, #{spouseUserId}, #{creatorUserId}, #{content}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "reportId")
    int insert(ScenarioReport report);

    @Select("SELECT r.report_id, r.conversation_id, r.scenario_id, r.spouse_user_id, r.creator_user_id, r.content, r.created_at, s.title AS scenario_title " +
            "FROM yunfu.scenario_report r " +
            "LEFT JOIN yunfu.scenario s ON r.scenario_id = s.scenario_id " +
            "WHERE r.spouse_user_id = #{spouseUserId} ORDER BY r.created_at DESC")
    @Results(id = "reportMap", value = {
            @Result(column = "report_id", property = "reportId"),
            @Result(column = "conversation_id", property = "conversationId"),
            @Result(column = "scenario_id", property = "scenarioId"),
            @Result(column = "spouse_user_id", property = "spouseUserId"),
            @Result(column = "creator_user_id", property = "creatorUserId"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "scenario_title", property = "scenarioTitle")
    })
    List<ScenarioReport> selectBySpouseUserId(@Param("spouseUserId") Integer spouseUserId);

    @Select("SELECT r.report_id, r.conversation_id, r.scenario_id, r.spouse_user_id, r.creator_user_id, r.content, r.created_at " +
            "FROM yunfu.scenario_report r WHERE r.report_id = #{reportId} AND r.spouse_user_id = #{spouseUserId}")
    @Results(id = "reportMapSimple", value = {
            @Result(column = "report_id", property = "reportId"),
            @Result(column = "conversation_id", property = "conversationId"),
            @Result(column = "scenario_id", property = "scenarioId"),
            @Result(column = "spouse_user_id", property = "spouseUserId"),
            @Result(column = "creator_user_id", property = "creatorUserId"),
            @Result(column = "created_at", property = "createdAt")
    })
    ScenarioReport selectByIdAndSpouse(@Param("reportId") Integer reportId, @Param("spouseUserId") Integer spouseUserId);
}
