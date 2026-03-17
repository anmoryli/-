package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.PregnancyWeightRecord;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface PregnancyWeightRecordMapper {

    @Insert("INSERT INTO pregnancy_weight_record (user_id, record_date, gestation_week, weight_kg, note) " +
            "VALUES (#{userId}, #{recordDate}, #{gestationWeek}, #{weightKg}, #{note})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(PregnancyWeightRecord record);

    @Select("SELECT * FROM pregnancy_weight_record WHERE user_id = #{userId} ORDER BY record_date DESC, id DESC")
    List<PregnancyWeightRecord> listByUserId(Integer userId);

    @Select("SELECT * FROM pregnancy_weight_record WHERE user_id = #{userId} ORDER BY record_date ASC, id ASC LIMIT 1")
    PregnancyWeightRecord firstByUserId(Integer userId);

    @Select("SELECT * FROM pregnancy_weight_record WHERE user_id = #{userId} ORDER BY record_date DESC, id DESC LIMIT 1")
    PregnancyWeightRecord latestByUserId(Integer userId);

    @Select("SELECT * FROM pregnancy_weight_record WHERE user_id = #{userId} AND record_date = #{recordDate} ORDER BY id DESC LIMIT 1")
    PregnancyWeightRecord latestByUserIdAndDate(Integer userId, LocalDate recordDate);
}

