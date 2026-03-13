package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.AiGenerationPostComment;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AiGenerationPostCommentMapper {

    @Insert("INSERT INTO ai_generation_post_comment(post_id, parent_comment_id, user_id, content, created_at, updated_at) VALUES(#{postId}, #{parentCommentId}, #{userId}, #{content}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "commentId")
    int insert(AiGenerationPostComment comment);

    @Select("SELECT * FROM ai_generation_post_comment WHERE post_id = #{postId} ORDER BY created_at ASC")
    List<AiGenerationPostComment> listByPostId(@Param("postId") Integer postId);

    @Select("SELECT * FROM ai_generation_post_comment WHERE post_id = #{postId} ORDER BY created_at ASC LIMIT #{limit} OFFSET #{offset}")
    List<AiGenerationPostComment> listByPostIdPaged(@Param("postId") Integer postId, @Param("limit") int limit, @Param("offset") int offset);

    @Select("SELECT * FROM ai_generation_post_comment WHERE comment_id = #{commentId}")
    AiGenerationPostComment findById(@Param("commentId") Integer commentId);

    @Update("UPDATE ai_generation_post_comment SET content = #{content}, updated_at = NOW() WHERE comment_id = #{commentId}")
    int updateContent(@Param("commentId") Integer commentId, @Param("content") String content);

    @Delete("DELETE FROM ai_generation_post_comment WHERE comment_id = #{commentId}")
    int deleteById(@Param("commentId") Integer commentId);
}

