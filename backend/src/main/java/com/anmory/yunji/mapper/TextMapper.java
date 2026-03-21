package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Text;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TextMapper {

    /**
     * 新增文字备忘录
     */
    @Insert("INSERT INTO yunfu.text (memo_id, title, content) VALUES (#{memoId}, #{title}, #{content})")
    @Options(useGeneratedKeys = true, keyProperty = "textId")
    void insert(Text text);

    /**
     * 根据ID更新文字备忘录
     */
    @Update("UPDATE yunfu.text SET title = #{title}, content = #{content} WHERE text_id = #{textId}")
    int updateById(Text text);

    @Select("SELECT memo_id FROM yunfu.text WHERE text_id = #{textId}")
    Integer selectMemoIdByTextId(@Param("textId") Integer textId);

    /**
     * 根据备忘录主ID查询文字记录
     */
    @Select("SELECT text_id, memo_id, title, content, created_at, updated_at FROM yunfu.text WHERE memo_id = #{memoId} LIMIT 1")
    @Results({
            @Result(column = "text_id", property = "textId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "title", property = "title"),
            @Result(column = "content", property = "content"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    Text selectByMemoId(Integer memoId);

    /**
     * 根据备忘录主ID删除文字记录
     */
    @Delete("DELETE FROM yunfu.text WHERE memo_id = #{memoId}")
    int deleteByMemoId(Integer memoId);

    /**
     * 根据用户ID查询所有文字备忘录
     */
    @Select("SELECT t.text_id, t.memo_id, t.title, t.content, t.created_at, t.updated_at, " +
            "m.pregnancy_week " +
            "FROM text t " +
            "LEFT JOIN memo m ON t.memo_id = m.memo_id " +
            "WHERE m.user_id = #{userId} " +
            "ORDER BY t.created_at DESC")
    @Results({
            @Result(column = "text_id", property = "textId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "title", property = "title"),
            @Result(column = "content", property = "content"),
            @Result(column = "pregnancy_week", property = "pregnancyWeek"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Text> selectByUserId(Integer userId);

    @Select("select count(text_id) from yunfu.text")
    Integer getTextCount();

    @Select("<script>SELECT t.text_id, t.memo_id, t.title, t.content, t.created_at, t.updated_at FROM yunfu.text t WHERE t.memo_id IN <foreach collection='memoIds' item='id' open='(' separator=',' close=')'>#{id}</foreach></script>")
    @Results({
            @Result(column = "text_id", property = "textId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "title", property = "title"),
            @Result(column = "content", property = "content"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Text> selectByMemoIds(@Param("memoIds") List<Integer> memoIds);

}