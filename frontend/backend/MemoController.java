package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.Photo;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.entity.Voice;
import com.anmory.yunji.service.MemoService;
import com.anmory.yunji.utils.AliOssUtil;
import com.anmory.yunji.utils.PregnancyWeekUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/memo")
@RequiredArgsConstructor // 构造器注入依赖
public class MemoController {

    private final MemoService memoService;
    private final AliOssUtil aliOssUtil;
    private final ChatClient chatClient; // AI客户端（Spring AI自动配置）

    // ========== 通用：获取用户末次月经日期（需补充用户表查询逻辑） ==========
    private String getLastMenstrualDate(Integer userId) {
        // 实际需从用户表查询，此处模拟返回
        return "2024-01-01";
    }

    // ========== 文字记录 ==========
    @RequestMapping("/addText")
    public Result<Integer> addText(@RequestParam("userId") Integer userId,
                                   @RequestParam(value = "title", required = false) String title,
                                   @RequestParam("content") String content) {
        // 1. 计算孕周
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);

        // 2. AI生成标题（如果用户未传）- 修正Spring AI 1.1.x调用方式
        if (title == null || title.trim().isEmpty()) {
            String promptStr = "请为以下孕期记录生成一个简洁的标题（不超过20字）：" + content;
            // 1.1.x版本正确用法：流式构建 + 直接获取content
            title = chatClient.prompt()
                    .user(promptStr)
                    .call()
                    .content();
        }

        // 3. 保存记录
        Integer memoId = memoService.addTextMemo(userId, title, content, pregnancyWeek);
        return Result.success(memoId);
    }

    @RequestMapping("/updateText")
    public Result<Boolean> updateText(@RequestParam("textId") Integer textId,
                                      @RequestParam("title") String title,
                                      @RequestParam("content") String content) {
        Boolean success = memoService.updateTextMemo(textId, title, content);
        return Result.success(success);
    }

    @RequestMapping("/deleteText")
    public Result<Boolean> deleteText(@RequestParam("memoId") Integer memoId) {
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/getTextByUserId")
    public Result<List<Text>> getTextByUserId(@RequestParam("userId") Integer userId) {
        List<Text> textList = memoService.getTextByUserId(userId);
        return Result.success(textList);
    }

    // ========== 语音记录 ==========
    @RequestMapping("/addVoice")
    public Result<Integer> addVoice(@RequestParam("userId") Integer userId,
                                    @RequestParam(value = "title", required = false) String title,
                                    @RequestParam("file") MultipartFile file) {
        // 1. 上传语音到OSS
        String voiceUrl = aliOssUtil.uploadVoice(userId, file);

        // 2. 语音转文字  TODO
       String textContent = "现需开发者完善";

        // 3. 计算孕周
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);

        // 4. AI生成标题（如果用户未传）- 修正Spring AI调用方式
        if (title == null || title.trim().isEmpty()) {
            String promptStr = "请为以下语音转文字的孕期记录生成一个简洁的标题（不超过20字）：" + textContent;
            title = chatClient.prompt()
                    .user(promptStr)
                    .call()
                    .content();
        }

        // 5. 保存记录
        Integer memoId = memoService.addVoiceMemo(userId, title, voiceUrl, textContent, pregnancyWeek);
        return Result.success(memoId);
    }

    @RequestMapping("/converToText")
    public Result<String> converToText(@RequestParam("url") String url) {
        // 调用语音转文字API（如阿里云ASR/百度ASR），此处模拟返回
        String text = "模拟语音转文字内容：今天感觉宝宝踢了我好几次，很开心！";
        return Result.success(text);
    }

    @RequestMapping("/deleteVoice")
    public Result<Boolean> deleteVoice(@RequestParam("memoId") Integer memoId) {
        // 1. 查询语音URL（需补充查询逻辑）
        String voiceUrl = "https://cangqion-delong.oss-cn-beijing.aliyuncs.com/yunji/1/voice/xxx.mp3";

        // 2. 删除OSS文件
        aliOssUtil.deleteFile(voiceUrl);

        // 3. 删除数据库记录
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/getVoiceByUserId")
    public Result<List<Voice>> getVoiceByUserId(@RequestParam("userId") Integer userId) {
        List<Voice> voiceList = memoService.getVoiceByUserId(userId);
        return Result.success(voiceList);
    }

    // ========== 文件记录 ==========
    @RequestMapping("/addFile")
    public Result<Integer> addFile(@RequestParam("userId") Integer userId,
                                   @RequestParam(value = "title", required = false) String title,
                                   @RequestParam("file") MultipartFile file) {
        // 1. 上传文件到OSS
        String fileUrl = aliOssUtil.uploadFile(userId, file);

        // 2. 计算孕周
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);

        // 3. AI生成标题（如果用户未传）- 修正Spring AI调用方式
        if (title == null || title.trim().isEmpty()) {
            String promptStr = "请为上传的孕期文件生成一个简洁的标题（不超过20字），文件名：" + file.getOriginalFilename();
            title = chatClient.prompt()
                    .user(promptStr)
                    .call()
                    .content();
        }

        // 4. 保存记录
        Integer memoId = memoService.addFileMemo(userId, title, fileUrl, pregnancyWeek);
        return Result.success(memoId);
    }

    @RequestMapping("/deleteFile")
    public Result<Boolean> deleteFile(@RequestParam("memoId") Integer memoId) {
        // 1. 查询文件URL（需补充查询逻辑）
        String fileUrl = "https://cangqion-delong.oss-cn-beijing.aliyuncs.com/yunji/1/file/xxx.pdf";

        // 2. 删除OSS文件
        aliOssUtil.deleteFile(fileUrl);

        // 3. 删除数据库记录
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    // ========== 照片记录 ==========
    @RequestMapping("/addPhoto")
    public Result<Integer> addPhoto(@RequestParam("userId") Integer userId,
                                    @RequestParam("files") List<MultipartFile> files,
                                    @RequestParam(value = "photoDescription", required = false) String photoDescription) {
        // 1. 校验照片数量（最多9张）
        if (files.size() > 9) {
            return Result.error("最多只能上传9张照片");
        }

        // 2. 批量上传照片到OSS
        List<String> photoUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            String photoUrl = aliOssUtil.uploadPhoto(userId, file);
            photoUrls.add(photoUrl);
        }

        // 3. 计算孕周
        String lastMenstrualDate = getLastMenstrualDate(userId);
        String pregnancyWeek = PregnancyWeekUtil.calculatePregnancyWeek(lastMenstrualDate);

        // 4. 保存记录
        Integer memoId = memoService.addPhotoMemo(userId, photoUrls, photoDescription, pregnancyWeek);
        return Result.success(memoId);
    }

    @RequestMapping("/deletePhoto")
    public Result<Boolean> deletePhoto(@RequestParam("memoId") Integer memoId) {
        // 1. 查询照片URL列表（需补充查询逻辑）
        List<String> photoUrls = List.of("https://cangqion-delong.oss-cn-beijing.aliyuncs.com/yunji/1/photo/xxx.jpg");

        // 2. 批量删除OSS文件
        for (String photoUrl : photoUrls) {
            aliOssUtil.deleteFile(photoUrl);
        }

        // 3. 删除数据库记录
        Boolean success = memoService.deleteMemo(memoId);
        return Result.success(success);
    }

    @RequestMapping("/getPhotoByUserId")
    public Result<List<Photo>> getPhotoByUserId(@RequestParam("userId") Integer userId) {
        List<Photo> photoList = memoService.getPhotoByUserId(userId);
        return Result.success(photoList);
    }

    // ========== 所有记录 ==========
    @RequestMapping("/getAllByUserId")
    public Result<List<Object>> getAllByUserId(@RequestParam("userId") Integer userId) {
        List<Object> allMemo = memoService.getAllMemoByUserId(userId);
        return Result.success(allMemo);
    }
}