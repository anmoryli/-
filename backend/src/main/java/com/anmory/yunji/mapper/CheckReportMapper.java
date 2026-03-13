package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.CheckReport;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface CheckReportMapper {

    @Insert("INSERT INTO check_report(user_id, file_url, original_filename, parsed_summary, next_check_date, email_sent, send_status, retry_count, created_at, updated_at) " +
            "VALUES(#{userId}, #{fileUrl}, #{originalFilename}, #{parsedSummary}, #{nextCheckDate}, #{emailSent}, #{sendStatus}, #{retryCount}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "reportId")
    int insert(CheckReport report);

    @Select("SELECT * FROM check_report WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<CheckReport> listByUserId(@Param("userId") Integer userId);

    @Select("SELECT * FROM check_report WHERE email_sent = 0 AND next_check_date <= #{today} AND retry_count < #{maxRetry}")
    List<CheckReport> listPendingToSend(@Param("today") LocalDate today, @Param("maxRetry") Integer maxRetry);

    @Select("SELECT * FROM check_report WHERE email_sent = 0 AND next_check_date <= #{today}")
    List<CheckReport> listDueReports(@Param("today") LocalDate today);

    @Update("UPDATE check_report SET email_sent = #{emailSent}, last_send_at = NOW(), send_status = #{sendStatus}, retry_count = #{retryCount}, updated_at = NOW() WHERE report_id = #{reportId}")
    int updateSendStatus(@Param("reportId") Integer reportId, @Param("emailSent") Boolean emailSent, @Param("sendStatus") String sendStatus, @Param("retryCount") Integer retryCount);
}

