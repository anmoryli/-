package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.UserGoalProgress;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserGoalProgressMapper {

    @Select("SELECT progress_id, user_id, template_id, current_value, status, completed_at, created_at, updated_at " +
            "FROM user_goal_progress WHERE user_id = #{userId} ORDER BY template_id")
    List<UserGoalProgress> selectByUserId(@Param("userId") Integer userId);

    @Select("SELECT progress_id, user_id, template_id, current_value, status, completed_at, created_at, updated_at " +
            "FROM user_goal_progress WHERE user_id = #{userId} AND template_id = #{templateId}")
    UserGoalProgress findByUserAndTemplate(@Param("userId") Integer userId, @Param("templateId") Integer templateId);

    @Insert("INSERT INTO user_goal_progress (user_id, template_id, current_value, status, created_at, updated_at) " +
            "VALUES (#{userId}, #{templateId}, #{currentValue}, #{status}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "progressId")
    int insert(UserGoalProgress progress);

    @Update("UPDATE user_goal_progress SET current_value = #{currentValue}, status = #{status}, completed_at = #{completedAt}, updated_at = NOW() " +
            "WHERE progress_id = #{progressId}")
    int update(UserGoalProgress progress);
}
