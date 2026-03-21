package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.AiGenerationPostLike;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AiGenerationPostLikeMapper {

    @Insert("INSERT INTO ai_generation_post_like(post_id, user_id, created_at, updated_at) VALUES(#{postId}, #{userId}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "likeId")
    int insert(AiGenerationPostLike like);

    @Delete("DELETE FROM ai_generation_post_like WHERE post_id = #{postId} AND user_id = #{userId}")
    int deleteByPostAndUser(@Param("postId") Integer postId, @Param("userId") Integer userId);

    @Select("SELECT COUNT(*) FROM ai_generation_post_like WHERE post_id = #{postId}")
    int countByPostId(@Param("postId") Integer postId);

    @Select("SELECT * FROM ai_generation_post_like WHERE post_id = #{postId} AND user_id = #{userId}")
    AiGenerationPostLike findByPostAndUser(@Param("postId") Integer postId, @Param("userId") Integer userId);
}

