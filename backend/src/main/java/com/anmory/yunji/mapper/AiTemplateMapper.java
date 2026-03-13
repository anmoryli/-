package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.AiTemplate;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface AiTemplateMapper {

    @Insert("INSERT INTO ai_template(user_id, title, prompt_text, category, cover_image_url, is_public, usage_count, created_at, updated_at) " +
            "VALUES(#{userId}, #{title}, #{promptText}, #{category}, #{coverImageUrl}, #{isPublic}, #{usageCount}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "templateId")
    int insert(AiTemplate template);

    @Update("UPDATE ai_template SET is_public = #{isPublic}, updated_at = NOW() WHERE template_id = #{templateId} AND user_id = #{userId}")
    int updatePublicStatus(@Param("templateId") Integer templateId, @Param("userId") Integer userId, @Param("isPublic") Boolean isPublic);

    @Select("SELECT * FROM ai_template WHERE is_public = 1 ORDER BY usage_count DESC, created_at DESC")
    List<AiTemplate> listPublicTemplates();

    @Select("SELECT * FROM ai_template WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<AiTemplate> listByUserId(@Param("userId") Integer userId);

    @Select("SELECT * FROM ai_template WHERE template_id = #{templateId}")
    AiTemplate findById(@Param("templateId") Integer templateId);

    @Update("UPDATE ai_template SET usage_count = usage_count + 1, updated_at = NOW() WHERE template_id = #{templateId}")
    int incrementUsageCount(@Param("templateId") Integer templateId);
}

