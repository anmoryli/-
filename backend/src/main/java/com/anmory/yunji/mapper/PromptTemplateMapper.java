package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.PromptTemplate;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface PromptTemplateMapper {

    @Select("SELECT id, `key`, model_type, system_prompt, user_prompt_template, created_at " +
            "FROM yunfu.prompt_template WHERE `key` = #{key} AND model_type = #{modelType}")
    @Results({
            @Result(column = "model_type", property = "modelType"),
            @Result(column = "system_prompt", property = "systemPrompt"),
            @Result(column = "user_prompt_template", property = "userPromptTemplate"),
            @Result(column = "created_at", property = "createdAt")
    })
    PromptTemplate selectByKeyAndModel(@Param("key") String key, @Param("modelType") String modelType);

    @Select("SELECT id, `key`, model_type, system_prompt, user_prompt_template, created_at " +
            "FROM yunfu.prompt_template ORDER BY `key`, model_type")
    @Results({
            @Result(column = "model_type", property = "modelType"),
            @Result(column = "system_prompt", property = "systemPrompt"),
            @Result(column = "user_prompt_template", property = "userPromptTemplate"),
            @Result(column = "created_at", property = "createdAt")
    })
    List<PromptTemplate> selectAll();
}
