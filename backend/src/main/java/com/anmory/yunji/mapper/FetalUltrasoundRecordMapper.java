package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.FetalUltrasoundRecord;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface FetalUltrasoundRecordMapper {

    @Insert("INSERT INTO fetal_ultrasound_record (user_id, record_date, gestation_week, bpd_mm, hc_mm, ac_mm, fl_mm, efw_g, note, file_url) " +
            "VALUES (#{userId}, #{recordDate}, #{gestationWeek}, #{bpdMm}, #{hcMm}, #{acMm}, #{flMm}, #{efwG}, #{note}, #{fileUrl})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(FetalUltrasoundRecord record);

    @Select("SELECT * FROM fetal_ultrasound_record WHERE user_id = #{userId} ORDER BY record_date DESC, id DESC")
    List<FetalUltrasoundRecord> listByUserId(Integer userId);

    @Select("SELECT * FROM fetal_ultrasound_record WHERE user_id = #{userId} ORDER BY record_date DESC, id DESC LIMIT 1")
    FetalUltrasoundRecord latestByUserId(Integer userId);

    @Select("SELECT * FROM fetal_ultrasound_record WHERE user_id = #{userId} AND record_date = #{recordDate} ORDER BY id DESC LIMIT 1")
    FetalUltrasoundRecord latestByUserIdAndDate(Integer userId, LocalDate recordDate);
}

