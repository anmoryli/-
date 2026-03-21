package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.RecordLike;
import org.apache.ibatis.annotations.*;

@Mapper
public interface RecordLikeMapper {

    @Insert("INSERT INTO record_like (memo_id, user_id, created_at) VALUES (#{memoId}, #{userId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "likeId")
    int insert(RecordLike like);

    @Delete("DELETE FROM record_like WHERE memo_id = #{memoId} AND user_id = #{userId}")
    int deleteByMemoAndUser(@Param("memoId") Integer memoId, @Param("userId") Integer userId);

    @Select("SELECT COUNT(*) FROM record_like WHERE memo_id = #{memoId}")
    int countByMemoId(@Param("memoId") Integer memoId);

    @Select("SELECT * FROM record_like WHERE memo_id = #{memoId} AND user_id = #{userId}")
    RecordLike findByMemoAndUser(@Param("memoId") Integer memoId, @Param("userId") Integer userId);
}
