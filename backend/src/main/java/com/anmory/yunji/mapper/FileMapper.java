package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.File;
import org.apache.ibatis.annotations.*;

import java.util.List;


@Mapper
public interface FileMapper {

    /**
     * 新增文件备忘录
     */
    @Insert("INSERT INTO yunfu.file (memo_id, title, url) VALUES (#{memoId}, #{title}, #{url})")
    @Options(useGeneratedKeys = true, keyProperty = "fileId")
    void insert(File file);

    /**
     * 根据备忘录主ID删除文件记录
     */
    @Delete("DELETE FROM yunfu.file WHERE memo_id = #{memoId}")
    int deleteByMemoId(Integer memoId);

    @Update("UPDATE yunfu.file SET title = #{title}, url = #{url}, updated_at = NOW() WHERE memo_id = #{memoId}")
    int updateByMemoId(File file);

    /**
     * 根据用户ID查询所有文件备忘录
     */
    @Select("SELECT f.file_id, f.memo_id, f.title, f.url as fileUrl, f.created_at, f.updated_at, " +
            "m.pregnancy_week " +
            "FROM yunfu.file f " +
            "LEFT JOIN yunfu.memo m ON f.memo_id = m.memo_id " +
            "WHERE m.user_id = #{userId} " +
            "ORDER BY f.created_at DESC")
    @Results({
            @Result(column = "file_id", property = "fileId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "title", property = "title"),
            @Result(column = "fileUrl", property = "url"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<File> selectByUserId(Integer userId);

    /**
     * 根据备忘录主ID查询文件URL（用于删除OSS文件）
     */
    @Select("SELECT url FROM yunfu.file WHERE memo_id = #{memoId}")
    String selectFileUrlByMemoId(Integer memoId);
}