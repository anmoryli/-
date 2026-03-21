package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.RelaxMusic;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RelaxMusicMapper {

    @Select("SELECT * FROM relax_music WHERE is_enabled = 1 ORDER BY sort_order ASC, music_id DESC")
    List<RelaxMusic> listEnabled();

    @Select("SELECT * FROM relax_music ORDER BY sort_order ASC, music_id DESC")
    List<RelaxMusic> listAll();

    @Select("SELECT * FROM relax_music WHERE music_id = #{musicId}")
    RelaxMusic findById(@Param("musicId") Integer musicId);

    @Select("<script>SELECT * FROM relax_music WHERE is_enabled = 1 AND category = #{category} ORDER BY sort_order ASC, music_id DESC</script>")
    List<RelaxMusic> listByCategory(@Param("category") String category);

    @Insert("INSERT INTO relax_music (title, artist, description, category, tags, file_url, cover_url, duration_seconds, sort_order, is_enabled) " +
            "VALUES (#{title}, #{artist}, #{description}, #{category}, #{tags}, #{fileUrl}, #{coverUrl}, #{durationSeconds}, #{sortOrder}, #{isEnabled})")
    @Options(useGeneratedKeys = true, keyProperty = "musicId")
    int insert(RelaxMusic music);

    @Update("UPDATE relax_music SET title=#{title}, artist=#{artist}, description=#{description}, " +
            "category=#{category}, tags=#{tags}, file_url=#{fileUrl}, cover_url=#{coverUrl}, " +
            "duration_seconds=#{durationSeconds}, sort_order=#{sortOrder}, is_enabled=#{isEnabled}, " +
            "updated_at=NOW() WHERE music_id=#{musicId}")
    int update(RelaxMusic music);

    @Delete("DELETE FROM relax_music WHERE music_id = #{musicId}")
    int deleteById(@Param("musicId") Integer musicId);
}
