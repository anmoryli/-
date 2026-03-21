package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Article;
import com.anmory.yunji.entity.User;
import com.anmory.yunji.service.ArticleService;
import com.anmory.yunji.service.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserService userService;

    @Autowired
    private TextService textService;

   @Autowired
   private VoiceService voiceService;

   @Autowired
   private PhotoServie photoServie;

   @Autowired
   private MessageService messageService;

   @Autowired
   private ArticleService articleService;

    // 获取所有用户信息
    @GetMapping("/getAllUsers")
    public Result<List<User>> getAllUsers() {
        List<User> userList = userService.getAllUsers();
        return Result.success(userList);
    }

    // 获取用户量
    @GetMapping("/getUserCount")
    public Result<Integer> getUserCount() {
        Integer userCount = userService.getUserCount();
        return Result.success(userCount);
    }

    // 根据用户id获取用户所有的记录
    @GetMapping("/getUserRecordsByUserId")
    public Result<List<Objects>> getUserRecordsByUserId(@RequestParam Integer userId) {
        List<Objects> userRecords = userService.getUserRecordsByUserId(userId);
        return Result.success(userRecords);
    }

    // 获取总的文字记录数
    @GetMapping("/getTextCount")
    public Result<Integer> getTextCount() {
        Integer textCount = textService.getTextCount();
        return Result.success(textCount);
    }

    // 获取总的录音记录数
    @GetMapping("/getVoiceCount")
    public Result<Integer> getVoiceCount() {
        Integer voiceCount = voiceService.getVoiceCount();
        return Result.success(voiceCount);
    }

    // 获取总的文件记录数
    @GetMapping("/getFileCount")
    public Result<Integer> getFileCount() {
        Integer fileCount = textService.getTextCount() + voiceService.getVoiceCount();
        return Result.success(fileCount);
    }

    // 获取总的照片数量
    @GetMapping("/getPhotoCount")
    public Result<Integer> getPhotoCount() {
        Integer photoCount = photoServie.getPhotoCount();
        return Result.success(photoCount);
    }

    // 按照日/月/年获取注册用户数
    @GetMapping("/getNewUserCountByType")
    public Result<Integer> getNewUserCountByType(String type) {
        // 不同的type写不同的代码去实现，比如type=day就写今日用户注册数的逻辑
        Integer newUserCount = 0;
        if (type.equals("day")) {
            newUserCount = userService.getNewUserCountByDay(LocalDateTime.now());
        } else if (type.equals("month")) {
            newUserCount = userService.getNewUserCountByMonth(LocalDateTime.now());
        } else if (type.equals("year")) {
            newUserCount = userService.getNewUserCountByYear(LocalDateTime.now());
        }
        return Result.success(newUserCount);
    }

    // 按照时间获取用户注册数，比如近7天
    @GetMapping("/getUserCountByTime")
    public Result<Integer> getUserCountByTime(LocalDateTime start, LocalDateTime end) {
        Integer userCount = userService.getUserCountByTime(start, end);
        return Result.success(userCount);
    }

    // 获取AI对话条数
    @GetMapping("/getAiMessageCount")
    public Result<Integer> getAiMessageCount() {
        Integer aiMessageCount = messageService.getAiMessageCount();
        return Result.success(aiMessageCount);
    }

    // 文章管理
    @GetMapping("/article/list")
    public Result<java.util.List<Article>> listArticles() {
        return Result.success(articleService.listAll());
    }

    @GetMapping("/article/get")
    public Result<Article> getArticle(@RequestParam Integer articleId) {
        return Result.success(articleService.getById(articleId));
    }

    @PostMapping("/article/create")
    public Result<Article> createArticle(@RequestBody Article article) {
        return Result.success(articleService.create(article));
    }

    @PutMapping("/article/update")
    public Result<Article> updateArticle(@RequestBody Article article) {
        return Result.success(articleService.update(article));
    }

    @DeleteMapping("/article/delete")
    public Result<Boolean> deleteArticle(@RequestParam Integer articleId) {
        return Result.success(articleService.delete(articleId));
    }

    // 用户管理：更新、删除
    @PutMapping("/user/update")
    public Result<User> updateUser(@RequestParam Integer userId,
                                  @RequestParam(required = false) String username,
                                  @RequestParam(required = false) String email,
                                  @RequestParam(required = false) String userType) {
        User user = userService.adminUpdateUser(userId, username, email, userType);
        return Result.success(user);
    }

    @DeleteMapping("/user/{userId}")
    public Result<Boolean> deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return Result.success(true);
    }

// 剩下的有关RAG和流畅度指标调度算法的就前端写死就行了，这方面的指标基本上不变
}
