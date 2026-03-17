package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.AiGenerationPost;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AiGenerationPostMapper {

    @Insert("INSERT INTO ai_generation_post(user_id, template_id, input_image_url, input_image_urls, output_image_url, prompt_text, is_public, created_at, updated_at) " +
            "VALUES(#{userId}, #{templateId}, #{inputImageUrl}, #{inputImageUrls}, #{outputImageUrl}, #{promptText}, #{isPublic}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "postId")
    int insert(AiGenerationPost post);

    @Update("UPDATE ai_generation_post SET is_public = #{isPublic}, updated_at = NOW() WHERE post_id = #{postId} AND user_id = #{userId}")
    int updatePublicStatus(@Param("postId") Integer postId, @Param("userId") Integer userId, @Param("isPublic") Boolean isPublic);

    @Select("SELECT * FROM ai_generation_post WHERE is_public = 1 ORDER BY created_at DESC")
    List<AiGenerationPost> listPublicLatest();

    @Select("SELECT p.* FROM ai_generation_post p LEFT JOIN ai_template t ON p.template_id = t.template_id " +
            "WHERE p.is_public = 1 ORDER BY COALESCE(t.usage_count, 0) DESC, p.created_at DESC")
    List<AiGenerationPost> listPublicRecommended();

    @Select("SELECT * FROM ai_generation_post WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<AiGenerationPost> listByUserId(@Param("userId") Integer userId);

    @Select("SELECT * FROM ai_generation_post WHERE is_public = 1 ORDER BY created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<AiGenerationPost> listPublicLatestPaged(@Param("limit") int limit, @Param("offset") int offset);

    @Select("SELECT p.* FROM ai_generation_post p LEFT JOIN ai_template t ON p.template_id = t.template_id " +
            "WHERE p.is_public = 1 ORDER BY COALESCE(t.usage_count, 0) DESC, p.created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<AiGenerationPost> listPublicRecommendedPaged(@Param("limit") int limit, @Param("offset") int offset);

    @Select("SELECT * FROM ai_generation_post WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<AiGenerationPost> listByUserIdPaged(@Param("userId") Integer userId, @Param("limit") int limit, @Param("offset") int offset);
}

