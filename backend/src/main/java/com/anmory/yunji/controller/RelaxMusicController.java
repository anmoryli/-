package com.anmory.yunji.controller;

import com.anmory.yunji.common.Result;
import com.anmory.yunji.entity.RelaxMusic;
import com.anmory.yunji.service.RelaxMusicService;
import com.anmory.yunji.utils.AliOssUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/relax-music")
public class RelaxMusicController {

    @Autowired
    private RelaxMusicService relaxMusicService;

    @Autowired
    private AliOssUtil aliOssUtil;

    @GetMapping("/list")
    public Result<List<RelaxMusic>> listEnabled() {
        log.info("请求获取启用的放松音乐列表");
        return Result.success(relaxMusicService.listEnabled());
    }

    @GetMapping("/list/category")
    public Result<List<RelaxMusic>> listByCategory(@RequestParam String category) {
        log.info("请求按分类获取放松音乐: category={}", category);
        return Result.success(relaxMusicService.listByCategory(category));
    }

    @GetMapping("/admin/list")
    public Result<List<RelaxMusic>> listAll() {
        log.info("管理端请求获取所有放松音乐");
        return Result.success(relaxMusicService.listAll());
    }

    @GetMapping("/{musicId}")
    public Result<RelaxMusic> getById(@PathVariable Integer musicId) {
        log.info("请求获取放松音乐详情: musicId={}", musicId);
        return Result.success(relaxMusicService.getById(musicId));
    }

    @PostMapping("/admin/upload")
    public Result<RelaxMusic> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "artist", required = false) String artist,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @RequestParam(value = "sortOrder", required = false, defaultValue = "0") Integer sortOrder,
            @RequestParam(value = "cover", required = false) MultipartFile cover
    ) {
        log.info("管理端上传放松音乐: title={}, category={}, fileSize={}", title, category, file.getSize());

        String fileUrl = uploadMusicFile(file);
        log.info("音乐文件上传成功: {}", fileUrl);

        String coverUrl = null;
        if (cover != null && !cover.isEmpty()) {
            coverUrl = uploadCoverFile(cover);
            log.info("封面文件上传成功: {}", coverUrl);
        }

        RelaxMusic music = new RelaxMusic();
        music.setTitle(title);
        music.setArtist(artist);
        music.setDescription(description);
        music.setCategory(category);
        music.setTags(tags);
        music.setFileUrl(fileUrl);
        music.setCoverUrl(coverUrl);
        music.setDurationSeconds(durationSeconds);
        music.setSortOrder(sortOrder);
        music.setIsEnabled(true);

        RelaxMusic created = relaxMusicService.create(music);
        log.info("放松音乐创建成功: musicId={}", created.getMusicId());
        return Result.success(created);
    }

    @PutMapping("/admin/update")
    public Result<RelaxMusic> update(@RequestBody RelaxMusic music) {
        log.info("管理端更新放松音乐: musicId={}", music.getMusicId());
        return Result.success(relaxMusicService.update(music));
    }

    @DeleteMapping("/admin/{musicId}")
    public Result<Boolean> delete(@PathVariable Integer musicId) {
        log.info("管理端删除放松音乐: musicId={}", musicId);
        return Result.success(relaxMusicService.delete(musicId));
    }

    private String uploadMusicFile(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String suffix = ".mp3";
            if (originalFilename != null && originalFilename.contains(".")) {
                suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String objectKey = "yunji/music/" + UUID.randomUUID() + suffix;
            return aliOssUtil.upload(file.getBytes(), objectKey);
        } catch (Exception e) {
            log.error("音乐文件上传 OSS 失败", e);
            throw new RuntimeException("音乐文件上传失败");
        }
    }

    private String uploadCoverFile(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String suffix = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String objectKey = "yunji/music/cover/" + UUID.randomUUID() + suffix;
            return aliOssUtil.upload(file.getBytes(), objectKey);
        } catch (Exception e) {
            log.error("封面图片上传 OSS 失败", e);
            throw new RuntimeException("封面图片上传失败");
        }
    }
}
