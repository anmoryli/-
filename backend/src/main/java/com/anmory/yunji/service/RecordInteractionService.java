package com.anmory.yunji.service;

import com.anmory.yunji.entity.RecordComment;
import com.anmory.yunji.entity.RecordLike;

import java.util.List;
import java.util.Map;

/**
 * 记录互动服务（评论、点赞）
 */
public interface RecordInteractionService {

    List<Map<String, Object>> getComments(Integer memoId, Integer requestUserId);

    RecordComment addComment(Integer memoId, Integer userId, String content, Integer parentCommentId);

    boolean deleteComment(Integer commentId, Integer requestUserId);

    int getLikeCount(Integer memoId);

    boolean isLiked(Integer memoId, Integer userId);

    boolean toggleLike(Integer memoId, Integer userId);

    /**
     * 检查用户是否可对记录进行评论/点赞（本人或家庭成员）
     */
    boolean canInteract(Integer memoId, Integer requestUserId);
}
