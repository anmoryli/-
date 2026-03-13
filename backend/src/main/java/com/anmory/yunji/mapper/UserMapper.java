package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Mapper
public interface UserMapper {


    @Select("select * from `user`  where username = #{username}")
    User selectByUsername(String username);



    @Insert("INSERT INTO `user` (username, password_hash, avatar_url, email, last_menstrual_date, pregnancy_time, user_type, default_relationship, created_at, updated_at) " +
            "VALUES (#{username}, #{passwordHash}, #{avatarUrl}, #{email}, #{lastMenstrualDate}, #{pregnancyTime}, #{userType}, #{defaultRelationship}, #{createdAt}, #{updatedAt})")
    void insert(User user);

    @Select("select * from user where email=#{email}")
    User selectByEmail(String email);

    @Select("select * from user where user_id=#{userId}")
    User selectById(Integer userId);

    void update(User user);

    @Delete("delete from user where user_id=#{userId}")
    void deleteById(Integer userId);

    @Select("select * from user")
    List<User> selectList();

    @Select("select count(*) from user")
    Integer selectCount();

   //TODO  应为不知道这个记录指的是什么  可能后面要新建一个record表 还是指的是user的全部信息  目前模棱两可
    @Select("select * from user where user_id=#{userId}")
    List<Objects> selectUserRecordsByUserId(Integer userId);

    // 按日统计
    @Select("select count(*) from user where created_at >= #{now} and created_at < date_add(#{now}, interval 1 day)")
    Integer selectNewUserCountByDay(LocalDateTime now);

    // 按月统计
    @Select("select count(*) from user where created_at >= #{now} and created_at < date_add(#{now}, interval 1 month)")
    Integer selectNewUserCountByMonth(LocalDateTime now);

    // 按年统计
    @Select("select count(*) from user where created_at >= #{now} and created_at < date_add(#{now}, interval 1 year)")
    Integer selectNewUserCountByYear(LocalDateTime now);

    // 按时间范围统计用户数
    @Select("select count(*) from user where created_at >= #{start} and created_at < #{end}")
    Integer selectUserCountByTime(LocalDateTime start, LocalDateTime end);

    /** 获取孕妇用户 ID 列表（用于破冰等） */
    @Select("SELECT user_id FROM user WHERE COALESCE(user_type, 'pregnant') = 'pregnant'")
    List<Integer> selectPregnantUserIds();

}
