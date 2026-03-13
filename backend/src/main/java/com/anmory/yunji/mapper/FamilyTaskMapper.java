package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.FamilyTask;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface FamilyTaskMapper {

    @Insert("INSERT INTO family_task (family_id, assignee_user_id, title, description, task_type, pregnancy_week, due_date, status, created_at) " +
            "VALUES (#{familyId}, #{assigneeUserId}, #{title}, #{description}, #{taskType}, #{pregnancyWeek}, #{dueDate}, #{status}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(FamilyTask t);

    @Select("SELECT * FROM family_task WHERE assignee_user_id = #{userId} ORDER BY status ASC, (due_date IS NULL), due_date ASC, created_at DESC")
    List<FamilyTask> selectByAssignee(@Param("userId") Integer userId);

    @Select("SELECT * FROM family_task WHERE family_id = #{familyId} ORDER BY status ASC, created_at DESC")
    List<FamilyTask> selectByFamilyId(@Param("familyId") Integer familyId);

    @Select("SELECT * FROM family_task WHERE id = #{id}")
    FamilyTask selectById(@Param("id") Integer id);

    @Update("UPDATE family_task SET status = 'completed', completed_at = #{completedAt} WHERE id = #{id}")
    int complete(@Param("id") Integer id, @Param("completedAt") LocalDateTime completedAt);
}
