package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.ScheduledOperation;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ScheduledOperationMapper {

    @Insert("INSERT INTO scheduled_operation (user_id, content, schedule_type, run_at, run_time, next_run_at, status, created_at) " +
            "VALUES (#{userId}, #{content}, #{scheduleType}, #{runAt}, #{runTime}, #{nextRunAt}, #{status}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ScheduledOperation op);

    @Select("SELECT * FROM scheduled_operation WHERE id = #{id}")
    ScheduledOperation selectById(@Param("id") Integer id);

    @Select("SELECT * FROM scheduled_operation WHERE next_run_at <= #{now} AND status = 'pending' ORDER BY next_run_at ASC LIMIT 100")
    List<ScheduledOperation> selectDue(@Param("now") LocalDateTime now);

    @Update("UPDATE scheduled_operation SET next_run_at = #{nextRunAt}, status = #{status} WHERE id = #{id}")
    int updateNextRun(@Param("id") Integer id, @Param("nextRunAt") LocalDateTime nextRunAt, @Param("status") String status);
}
