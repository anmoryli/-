package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.RecordComment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RecordCommentMapper {

    @Insert("INSERT INTO record_comment (memo_id, parent_comment_id, user_id, content, created_at) " +
            "VALUES (#{memoId}, #{parentCommentId}, #{userId}, #{content}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "commentId")
    int insert(RecordComment comment);

    @Select("SELECT * FROM record_comment WHERE memo_id = #{memoId} ORDER BY COALESCE(parent_comment_id, comment_id), (parent_comment_id IS NOT NULL), created_at ASC")
    List<RecordComment> selectByMemoId(@Param("memoId") Integer memoId);

    @Delete("DELETE FROM record_comment WHERE comment_id = #{commentId}")
    int deleteById(@Param("commentId") Integer commentId);

    @Select("SELECT * FROM record_comment WHERE comment_id = #{commentId}")
    RecordComment selectById(@Param("commentId") Integer commentId);
}
