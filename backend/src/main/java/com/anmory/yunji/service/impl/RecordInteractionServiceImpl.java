package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.RecordComment;
import com.anmory.yunji.entity.RecordLike;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.RecordCommentMapper;
import com.anmory.yunji.mapper.RecordLikeMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.RecordInteractionService;
import com.anmory.yunji.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecordInteractionServiceImpl implements RecordInteractionService {

    private final RecordCommentMapper commentMapper;
    private final RecordLikeMapper likeMapper;
    private final MemoMapper memoMapper;
    private final FamilyService familyService;
    private final UserService userService;

    @Override
    public List<Map<String, Object>> getComments(Integer memoId, Integer requestUserId) {
        if (!canInteract(memoId, requestUserId)) return List.of();
        List<RecordComment> comments = commentMapper.selectByMemoId(memoId);
        Map<Integer, Map<String, Object>> idToNode = new HashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();
        for (RecordComment c : comments) {
            User u = userService.getById(c.getUserId());
            Map<String, Object> row = new HashMap<>();
            row.put("commentId", c.getCommentId());
            row.put("parentCommentId", c.getParentCommentId());
            row.put("userId", c.getUserId());
            row.put("username", u != null ? u.getUsername() : "");
            row.put("userType", u != null ? u.getUserType() : null);
            row.put("content", c.getContent());
            row.put("createdAt", c.getCreatedAt());
            row.put("replies", new ArrayList<Map<String, Object>>());
            idToNode.put(c.getCommentId(), row);
        }
        for (RecordComment c : comments) {
            Map<String, Object> row = idToNode.get(c.getCommentId());
            if (c.getParentCommentId() == null) {
                roots.add(row);
            } else {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> replies = (List<Map<String, Object>>) idToNode.get(c.getParentCommentId()).get("replies");
                if (replies != null) replies.add(row);
            }
        }
        return roots;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RecordComment addComment(Integer memoId, Integer userId, String content, Integer parentCommentId) {
        if (!canInteract(memoId, userId)) return null;
        if (content == null || content.trim().isEmpty()) return null;
        if (parentCommentId != null) {
            RecordComment parent = commentMapper.selectById(parentCommentId);
            if (parent == null || !parent.getMemoId().equals(memoId)) return null;
        }
        RecordComment comment = new RecordComment();
        comment.setMemoId(memoId);
        comment.setParentCommentId(parentCommentId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        commentMapper.insert(comment);
        return comment;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteComment(Integer commentId, Integer requestUserId) {
        RecordComment c = commentMapper.selectById(commentId);
        if (c == null) return false;
        if (!c.getUserId().equals(requestUserId)) return false;
        commentMapper.deleteById(commentId);
        return true;
    }

    @Override
    public int getLikeCount(Integer memoId) {
        return likeMapper.countByMemoId(memoId);
    }

    @Override
    public boolean isLiked(Integer memoId, Integer userId) {
        return likeMapper.findByMemoAndUser(memoId, userId) != null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean toggleLike(Integer memoId, Integer userId) {
        if (!canInteract(memoId, userId)) return false;
        RecordLike existing = likeMapper.findByMemoAndUser(memoId, userId);
        if (existing != null) {
            likeMapper.deleteByMemoAndUser(memoId, userId);
            return false;
        }
        RecordLike like = new RecordLike();
        like.setMemoId(memoId);
        like.setUserId(userId);
        likeMapper.insert(like);
        return true;
    }

    @Override
    public boolean canInteract(Integer memoId, Integer requestUserId) {
        Memo memo = memoMapper.selectByIdCompat(memoId);
        if (memo == null) return false;
        return familyService.canViewRecord(memo.getUserId(), requestUserId);
    }
}
