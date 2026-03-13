package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.UserNotification;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserNotificationMapper {

    @Insert("INSERT INTO user_notification (user_id, type, title, body, related_task_id, created_at) " +
            "VALUES (#{userId}, #{type}, #{title}, #{body}, #{relatedTaskId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(UserNotification n);

    @Select("SELECT * FROM user_notification WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}")
    List<UserNotification> selectByUserId(@Param("userId") Integer userId, @Param("limit") int limit);

    @Select("SELECT * FROM user_notification WHERE id = #{id} AND user_id = #{userId}")
    UserNotification selectByIdAndUserId(@Param("id") Integer id, @Param("userId") Integer userId);

    @Update("UPDATE user_notification SET read_at = #{readAt} WHERE id = #{id}")
    int markRead(@Param("id") Integer id, @Param("readAt") LocalDateTime readAt);

    @Update("UPDATE user_notification SET read_at = #{readAt} WHERE user_id = #{userId} AND read_at IS NULL")
    int markAllReadByUserId(@Param("userId") Integer userId, @Param("readAt") LocalDateTime readAt);

    @Select("SELECT COUNT(*) FROM user_notification WHERE user_id = #{userId} AND read_at IS NULL")
    int countUnreadByUserId(@Param("userId") Integer userId);

    /** 是否已存在某用户、某类型、某标题的通知（用于“只提醒一次”逻辑） */
    @Select("SELECT COUNT(*) FROM user_notification WHERE user_id = #{userId} AND type = #{type} AND title = #{title}")
    int countByUserIdAndTypeAndTitle(@Param("userId") Integer userId, @Param("type") String type, @Param("title") String title);
}
