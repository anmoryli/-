package com.anmory.yunji.mapper;

import com.anmory.yunji.entity.Message;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface MessageMapper {

    @Select("SELECT count(message_id) FROM yunfu.message WHERE is_ai = 1")
    Integer selectAiMessageCount();

    @Insert("INSERT INTO yunfu.message (conversation_id, user_id, content, is_ai, created_at, updated_at) " +
            "VALUES (#{conversationId}, #{userId}, #{content}, #{isAi}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "messageId")
    int insert(Message message);

    @Select("SELECT message_id, conversation_id, user_id, content, is_ai, created_at, updated_at " +
            "FROM yunfu.message WHERE conversation_id = #{conversationId} ORDER BY created_at ASC")
    @Results(id = "msgMap", value = {
            @Result(column = "message_id", property = "messageId"),
            @Result(column = "conversation_id", property = "conversationId"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "is_ai", property = "isAi"),
            @Result(column = "created_at", property = "createdAt"),
            @Result(column = "updated_at", property = "updatedAt")
    })
    List<Message> selectByConversationId(Integer conversationId);

    /** 获取在指定时间后发送过用户消息的 userId 列表 */
    @Select("SELECT DISTINCT user_id FROM yunfu.message WHERE is_ai = 0 AND created_at >= #{since}")
    List<Integer> selectUserIdsWithUserMessageAfter(@Param("since") LocalDateTime since);
}
