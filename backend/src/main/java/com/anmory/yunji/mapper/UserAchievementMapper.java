package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.UserAchievement;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserAchievementMapper {

    @Select("SELECT achievement_id, user_id, badge_key, badge_name, earned_at " +
            "FROM user_achievements WHERE user_id = #{userId} ORDER BY earned_at DESC")
    List<UserAchievement> selectByUserId(@Param("userId") Integer userId);

    @Insert("INSERT INTO user_achievements (user_id, badge_key, badge_name, earned_at) " +
            "VALUES (#{userId}, #{badgeKey}, #{badgeName}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "achievementId")
    int insert(UserAchievement achievement);
}
