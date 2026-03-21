package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.EmbedTask;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Set;

@Mapper
public interface EmbedTaskMapper {

    @Insert("INSERT INTO embed_task (user_id, source, source_id, action, text_snapshot, status, retry_count, max_retry) " +
            "VALUES (#{userId}, #{source}, #{sourceId}, #{action}, #{textSnapshot}, #{status}, #{retryCount}, #{maxRetry})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(EmbedTask task);

    @Select("SELECT id, user_id, source, source_id, action, text_snapshot, status, retry_count, max_retry, error_msg, created_at, updated_at " +
            "FROM embed_task WHERE source = #{source} AND source_id = #{sourceId} AND status IN ('pending', 'waiting_enrich') LIMIT 1")
    @Results(id = "embedTaskResult", value = {
            @Result(column = "user_id", property = "userId"),
            @Result(column = "source_id", property = "sourceId"),
            @Result(column = "text_snapshot", property = "textSnapshot"),
            @Result(column = "retry_count", property = "retryCount"),
            @Result(column = "max_retry", property = "maxRetry"),
            @Result(column = "error_msg", property = "errorMsg"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    EmbedTask selectPendingBySource(@Param("source") String source, @Param("sourceId") String sourceId);

    @Select("SELECT id, user_id, source, source_id, action, text_snapshot, status, retry_count, max_retry, error_msg, created_at, updated_at " +
            "FROM embed_task WHERE status = 'pending' ORDER BY created_at ASC LIMIT #{limit}")
    @ResultMap("embedTaskResult")
    List<EmbedTask> selectPending(@Param("limit") int limit);

    @Update("UPDATE embed_task SET status = #{status}, updated_at = NOW() WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") String status);

    @Update("UPDATE embed_task SET text_snapshot = #{text}, status = 'pending', updated_at = NOW() WHERE id = #{id}")
    int updateTextSnapshot(@Param("id") Long id, @Param("text") String text);

    @Update("UPDATE embed_task SET status = 'failed', retry_count = #{retryCount}, error_msg = #{errorMsg}, updated_at = NOW() WHERE id = #{id}")
    int markFailed(@Param("id") Long id, @Param("retryCount") int retryCount, @Param("errorMsg") String errorMsg);

    @Update("UPDATE embed_task SET status = 'pending', retry_count = #{retryCount}, error_msg = #{errorMsg}, updated_at = NOW() WHERE id = #{id}")
    int markRetry(@Param("id") Long id, @Param("retryCount") int retryCount, @Param("errorMsg") String errorMsg);

    @Select("SELECT source_id FROM embed_task WHERE source = #{source} AND status = 'success'")
    List<String> selectSuccessSourceIds(@Param("source") String source);
}
