package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.AiGenerationPostCommentLike;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AiGenerationPostCommentLikeMapper {

    @Insert("INSERT INTO ai_generation_post_comment_like(comment_id, user_id, created_at) VALUES(#{commentId}, #{userId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "likeId")
    int insert(AiGenerationPostCommentLike like);

    @Delete("DELETE FROM ai_generation_post_comment_like WHERE comment_id = #{commentId} AND user_id = #{userId}")
    int deleteByCommentAndUser(@Param("commentId") Integer commentId, @Param("userId") Integer userId);

    @Select("SELECT COUNT(*) FROM ai_generation_post_comment_like WHERE comment_id = #{commentId}")
    int countByCommentId(@Param("commentId") Integer commentId);

    @Select("SELECT * FROM ai_generation_post_comment_like WHERE comment_id = #{commentId} AND user_id = #{userId}")
    AiGenerationPostCommentLike findByCommentAndUser(@Param("commentId") Integer commentId, @Param("userId") Integer userId);
}
