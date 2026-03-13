package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Article;
import com.anmory.yunji.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/article")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @GetMapping("/list")
    public Result<List<Article>> listPublished(@RequestParam(required = false) Integer userId) {
        if (userId != null) {
            return Result.success(articleService.listPublishedForUser(userId));
        }
        return Result.success(articleService.listPublished());
    }

    @GetMapping("/{articleId}")
    public Result<Article> getById(@PathVariable Integer articleId) {
        Article a = articleService.getById(articleId);
        if (a == null) {
            return Result.error(404, "NOT_FOUND", "文章不存在");
        }
        if (!Boolean.TRUE.equals(a.getIsPublished())) {
            return Result.error(404, "NOT_FOUND", "文章不存在");
        }
        return Result.success(a);
    }
}
