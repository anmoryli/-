package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.UserDailyLog;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface UserDailyLogMapper {

    @Select("SELECT * FROM user_daily_log WHERE user_id = #{userId} AND record_date = #{recordDate}")
    UserDailyLog findByUserAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);

    @Select("SELECT * FROM user_daily_log WHERE user_id = #{userId} AND record_date >= #{from} AND record_date <= #{to} ORDER BY record_date DESC")
    List<UserDailyLog> findByUserAndDateRange(@Param("userId") Integer userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Insert("INSERT INTO user_daily_log (user_id, record_date, kick_count, mood, weight_kg, created_at, updated_at) " +
            "VALUES (#{userId}, #{recordDate}, #{kickCount}, #{mood}, #{weightKg}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "logId")
    int insert(UserDailyLog log);

    @Update("UPDATE user_daily_log SET kick_count = #{kickCount}, mood = #{mood}, weight_kg = #{weightKg}, health_value = #{healthValue}, updated_at = NOW() " +
            "WHERE log_id = #{logId}")
    int update(UserDailyLog log);

    @Select("SELECT COALESCE(SUM(kick_count), 0) FROM user_daily_log WHERE user_id = #{userId}")
    int sumKickCountByUserId(@Param("userId") Integer userId);
}
