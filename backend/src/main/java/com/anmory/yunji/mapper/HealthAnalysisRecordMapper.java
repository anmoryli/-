package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.HealthAnalysisRecord;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface HealthAnalysisRecordMapper {

    @Insert("INSERT INTO health_analysis_record (user_id, record_type, record_id, gestation_week, analysis_text) " +
            "VALUES (#{userId}, #{recordType}, #{recordId}, #{gestationWeek}, #{analysisText})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(HealthAnalysisRecord record);

    @Select("SELECT * FROM health_analysis_record WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}")
    List<HealthAnalysisRecord> listByUserId(@org.apache.ibatis.annotations.Param("userId") Integer userId,
                                           @org.apache.ibatis.annotations.Param("limit") int limit);

    @Select("SELECT * FROM health_analysis_record WHERE user_id = #{userId} AND record_type = #{recordType} AND record_id = #{recordId} LIMIT 1")
    HealthAnalysisRecord selectByRecord(@org.apache.ibatis.annotations.Param("userId") Integer userId,
                                        @org.apache.ibatis.annotations.Param("recordType") String recordType,
                                        @org.apache.ibatis.annotations.Param("recordId") Long recordId);
}
