package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.RelaxMusic;
import com.anmory.yunji.exception.BusinessException;
import com.anmory.yunji.mapper.RelaxMusicMapper;
import com.anmory.yunji.service.RelaxMusicService;
import com.anmory.yunji.utils.AliOssUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class RelaxMusicServiceImpl implements RelaxMusicService {

    @Autowired
    private RelaxMusicMapper relaxMusicMapper;

    @Autowired
    private AliOssUtil aliOssUtil;

    @Override
    public List<RelaxMusic> listEnabled() {
        log.info("查询所有启用的放松音乐");
        List<RelaxMusic> list = relaxMusicMapper.listEnabled();
        log.info("查询到 {} 条启用的放松音乐", list.size());
        return list;
    }

    @Override
    public List<RelaxMusic> listAll() {
        log.info("查询所有放松音乐（含禁用）");
        List<RelaxMusic> list = relaxMusicMapper.listAll();
        log.info("查询到 {} 条放松音乐", list.size());
        return list;
    }

    @Override
    public List<RelaxMusic> listByCategory(String category) {
        log.info("按分类查询放松音乐: category={}", category);
        List<RelaxMusic> list = relaxMusicMapper.listByCategory(category);
        log.info("分类 {} 下查询到 {} 条音乐", category, list.size());
        return list;
    }

    @Override
    public RelaxMusic getById(Integer musicId) {
        log.info("根据ID查询放松音乐: musicId={}", musicId);
        RelaxMusic music = relaxMusicMapper.findById(musicId);
        if (music == null) {
            log.warn("放松音乐不存在: musicId={}", musicId);
            throw new BusinessException(404, "NOT_FOUND", "音乐不存在");
        }
        return music;
    }

    @Override
    public RelaxMusic create(RelaxMusic music) {
        log.info("创建放松音乐: title={}, category={}", music.getTitle(), music.getCategory());
        if (music.getIsEnabled() == null) {
            music.setIsEnabled(true);
        }
        if (music.getSortOrder() == null) {
            music.setSortOrder(0);
        }
        relaxMusicMapper.insert(music);
        log.info("放松音乐创建成功: musicId={}", music.getMusicId());
        return relaxMusicMapper.findById(music.getMusicId());
    }

    @Override
    public RelaxMusic update(RelaxMusic music) {
        log.info("更新放松音乐: musicId={}, title={}", music.getMusicId(), music.getTitle());
        RelaxMusic existing = relaxMusicMapper.findById(music.getMusicId());
        if (existing == null) {
            log.warn("要更新的放松音乐不存在: musicId={}", music.getMusicId());
            throw new BusinessException(404, "NOT_FOUND", "音乐不存在");
        }
        relaxMusicMapper.update(music);
        log.info("放松音乐更新成功: musicId={}", music.getMusicId());
        return relaxMusicMapper.findById(music.getMusicId());
    }

    @Override
    public boolean delete(Integer musicId) {
        log.info("删除放松音乐: musicId={}", musicId);
        RelaxMusic existing = relaxMusicMapper.findById(musicId);
        if (existing == null) {
            log.warn("要删除的放松音乐不存在: musicId={}", musicId);
            throw new BusinessException(404, "NOT_FOUND", "音乐不存在");
        }
        if (existing.getFileUrl() != null && !existing.getFileUrl().isBlank()) {
            try {
                aliOssUtil.deleteFile(existing.getFileUrl());
                log.info("已删除音乐文件 OSS: {}", existing.getFileUrl());
            } catch (Exception e) {
                log.warn("删除音乐 OSS 文件失败（忽略）: {}", e.getMessage());
            }
        }
        if (existing.getCoverUrl() != null && !existing.getCoverUrl().isBlank()) {
            try {
                aliOssUtil.deleteFile(existing.getCoverUrl());
                log.info("已删除封面 OSS: {}", existing.getCoverUrl());
            } catch (Exception e) {
                log.warn("删除封面 OSS 文件失败（忽略）: {}", e.getMessage());
            }
        }
        int rows = relaxMusicMapper.deleteById(musicId);
        log.info("放松音乐删除结果: musicId={}, affectedRows={}", musicId, rows);
        return rows > 0;
    }
}
