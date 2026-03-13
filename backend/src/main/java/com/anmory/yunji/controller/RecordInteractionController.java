package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.RecordComment;
import com.anmory.yunji.service.RecordInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/record-interaction")
@RequiredArgsConstructor
public class RecordInteractionController {

    private final RecordInteractionService interactionService;

    @GetMapping("/comments")
    public Result<List<Map<String, Object>>> getComments(@RequestParam("memoId") Integer memoId,
                                                         @RequestParam("userId") Integer userId) {
        List<Map<String, Object>> list = interactionService.getComments(memoId, userId);
        return Result.success(list);
    }

    @PostMapping("/comment")
    public Result<RecordComment> addComment(@RequestParam("memoId") Integer memoId,
                                            @RequestParam("userId") Integer userId,
                                            @RequestParam("content") String content,
                                            @RequestParam(value = "parentCommentId", required = false) Integer parentCommentId) {
        RecordComment comment = interactionService.addComment(memoId, userId, content, parentCommentId);
        if (comment == null) {
            return Result.error("无法评论该记录");
        }
        return Result.success(comment);
    }

    @DeleteMapping("/comment")
    public Result<Boolean> deleteComment(@RequestParam("commentId") Integer commentId,
                                         @RequestParam("userId") Integer userId) {
        boolean ok = interactionService.deleteComment(commentId, userId);
        return Result.success(ok);
    }

    @GetMapping("/like/count")
    public Result<Integer> getLikeCount(@RequestParam("memoId") Integer memoId) {
        int count = interactionService.getLikeCount(memoId);
        return Result.success(count);
    }

    @GetMapping("/like/status")
    public Result<Boolean> isLiked(@RequestParam("memoId") Integer memoId,
                                   @RequestParam("userId") Integer userId) {
        boolean liked = interactionService.isLiked(memoId, userId);
        return Result.success(liked);
    }

    @PostMapping("/like/toggle")
    public Result<Map<String, Object>> toggleLike(@RequestParam("memoId") Integer memoId,
                                                  @RequestParam("userId") Integer userId) {
        boolean liked = interactionService.toggleLike(memoId, userId);
        int count = interactionService.getLikeCount(memoId);
        return Result.success(Map.of("liked", liked, "count", count));
    }
}
