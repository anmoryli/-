package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Voice;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface VoiceMapper {

    /**
     * 新增语音备忘录
     */
    @Insert("INSERT INTO yunfu.voice (memo_id, title, url) " +
            "VALUES (#{memoId}, #{title}, #{url})")
    @Options(useGeneratedKeys = true, keyProperty = "voiceId")
    void insert(Voice voice);

    /**
     * 根据备忘录主ID删除语音记录
     */
    @Delete("DELETE FROM yunfu.voice WHERE memo_id = #{memoId}")
    int deleteByMemoId(Integer memoId);

    @Update("UPDATE yunfu.voice SET title = #{title}, url = #{url}, updated_at = NOW() WHERE memo_id = #{memoId}")
    int updateByMemoId(Voice voice);

    /**
     * 根据用户ID查询所有语音备忘录
     */
    @Select("SELECT v.voice_id, v.memo_id, v.title, v.url as voiceUrl, v.created_at, v.updated_at, " +
            "m.pregnancy_week " +
            "FROM yunfu.voice v " +
            "LEFT JOIN yunfu.memo m ON v.memo_id = m.memo_id " +
            "WHERE m.user_id = #{userId} " +
            "ORDER BY v.created_at DESC")
    @Results({
            @Result(column = "voice_id", property = "voiceId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "title", property = "title"),
            @Result(column = "voiceUrl", property = "url"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Voice> selectByUserId(Integer userId);

    /**
     * 根据备忘录主ID查询语音URL（用于删除OSS文件）
     */
    @Select("SELECT url FROM yunfu.voice WHERE memo_id = #{memoId}")
    String selectVoiceUrlByMemoId(Integer memoId);

    @Select("select count(voice_id) from yunfu.voice")
    Integer selectCount();

}