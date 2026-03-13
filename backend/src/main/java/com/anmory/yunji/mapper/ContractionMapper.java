package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Contraction;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ContractionMapper {

    @Select("SELECT * FROM contraction WHERE user_id = #{userId} AND DATE(started_at) = #{date} ORDER BY started_at ASC")
    List<Contraction> findByUserAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);

    @Insert("INSERT INTO contraction (user_id, started_at, duration_seconds, created_at) " +
            "VALUES (#{userId}, #{startedAt}, #{durationSeconds}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "contractionId")
    int insert(Contraction contraction);

    @Delete("DELETE FROM contraction WHERE user_id = #{userId} AND DATE(started_at) = #{date}")
    int deleteByUserAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);
}
