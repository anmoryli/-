package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Conversation;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ConversationMapper {

    @Insert("INSERT INTO yunfu.conversation (user_id, memo_id, title, created_at, updated_at) " +
            "VALUES (#{userId}, #{memoId}, #{title}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "conversationId")
    int insert(Conversation conversation);

    @Select("SELECT conversation_id, user_id, memo_id, title, has_unread_ai, created_at, updated_at " +
            "FROM yunfu.conversation WHERE user_id = #{userId} ORDER BY updated_at DESC")
    @Results(id = "convMap", value = {
            @Result(column = "conversation_id", property = "conversationId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "memo_id", property = "memoId"),
            @Result(column = "has_unread_ai", property = "hasUnreadAi"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Conversation> selectByUserId(Integer userId);

    @Select("SELECT conversation_id, user_id, memo_id, title, has_unread_ai, created_at, updated_at " +
            "FROM yunfu.conversation WHERE conversation_id = #{conversationId}")
    @ResultMap("convMap")
    Conversation selectById(@Param("conversationId") Integer conversationId);

    @Select("SELECT conversation_id, user_id, memo_id, title, has_unread_ai, created_at, updated_at " +
            "FROM yunfu.conversation WHERE conversation_id = #{conversationId} AND user_id = #{userId}")
    @ResultMap("convMap")
    Conversation selectByIdAndUserId(@Param("conversationId") Integer conversationId, @Param("userId") Integer userId);

    @Update("UPDATE yunfu.conversation SET has_unread_ai = #{flag} WHERE conversation_id = #{conversationId}")
    int updateHasUnreadAi(@Param("conversationId") Integer conversationId, @Param("flag") boolean flag);

    @Delete("DELETE FROM yunfu.conversation WHERE conversation_id = #{conversationId} AND user_id = #{userId}")
    int deleteByIdAndUserId(@Param("conversationId") Integer conversationId, @Param("userId") Integer userId);

    @Update("UPDATE yunfu.conversation SET title = #{title}, updated_at = NOW() WHERE conversation_id = #{conversationId}")
    int updateTitle(@Param("conversationId") Integer conversationId, @Param("title") String title);
}
