package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.MoodRecord;
import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface MoodRecordMapper {

    @Insert("INSERT INTO mood_record (user_id, record_date, record_time, mood) " +
            "VALUES (#{userId}, #{recordDate}, #{recordTime}, #{mood})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MoodRecord record);

    @Select("SELECT * FROM mood_record WHERE user_id = #{userId} AND record_date >= #{from} AND record_date <= #{to} " +
            "ORDER BY record_date DESC, record_time DESC")
    List<MoodRecord> findByUserAndDateRange(@Param("userId") Integer userId,
                                            @Param("from") LocalDate from,
                                            @Param("to") LocalDate to);
}
