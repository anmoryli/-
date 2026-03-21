package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Photo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface PhotoMapper {

    /**
     * 新增照片记录
     */
    @Insert("INSERT INTO yunfu.photo (memo_id, url) VALUES (#{memoId}, #{url})")
    @Options(useGeneratedKeys = true, keyProperty = "photoId")
    void insert(Photo photo);

    /**
     * 根据备忘录主ID删除照片记录
     */
    @Delete("DELETE FROM yunfu.photo WHERE memo_id = #{memoId}")
    int deleteByMemoId(Integer memoId);

    /**
     * 根据用户ID查询所有照片备忘录（关联主表获取描述和孕周）
     */
    @Select("SELECT p.photo_id, p.memo_id, p.url as photoUrl, p.created_at, p.updated_at, " +
            "m.photo_description, m.pregnancy_week " +
            "FROM yunfu.photo p " +
            "LEFT JOIN yunfu.memo m ON p.memo_id = m.memo_id " +
            "WHERE m.user_id = #{userId} " +
            "ORDER BY p.created_at DESC")
    @Results({
            @Result(column = "photo_id", property = "photoId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "photoUrl", property = "url"),
            @Result(column = "photo_description", property = "photoDescription"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Photo> selectByUserId(Integer userId);

    /**
     * 根据备忘录主ID查询照片URL列表（用于删除OSS文件）
     */
    @Select("SELECT url FROM yunfu.photo WHERE memo_id = #{memoId}")
    List<String> selectPhotoUrlsByMemoId(Integer memoId);

    @Select("select count(photo_id) from yunfu.photo ")
    Integer selectCount();

    @Select("SELECT COUNT(*) FROM yunfu.photo p JOIN yunfu.memo m ON p.memo_id = m.memo_id WHERE m.user_id = #{userId}")
    int countByUserId(@Param("userId") Integer userId);

    @Select("<script>SELECT p.photo_id, p.memo_id, p.url, p.created_at, p.updated_at FROM yunfu.photo p WHERE p.memo_id IN <foreach collection='memoIds' item='id' open='(' separator=',' close=')'>#{id}</foreach></script>")
    @Results({
            @Result(column = "photo_id", property = "photoId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "url", property = "url"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Photo> selectByMemoIds(@Param("memoIds") List<Integer> memoIds);

}