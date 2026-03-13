package com.anmory.yunji.service;

import com.anmory.yunji.entity.File;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.Photo;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.entity.Voice;

import java.util.List;

public interface MemoService {

    // ========== 备忘录主表操作 ==========
    /**
     * 新增备忘录主记录
     */
    Integer addMemo(Memo memo);

    /**
     * 删除备忘录主记录（级联删除关联表）
     */
    Boolean deleteMemo(Integer memoId);

    // ========== 文字记录 ==========
    Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek);

    Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek, String tag);

    Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek, String tag, String mood, String visibilityMode, String visibleTo, String category);

    Boolean updateTextMemo(Integer textId, String title, String content);

    List<Text> getTextByUserId(Integer userId);

    // ========== 语音记录 ==========
    Integer addVoiceMemo(Integer userId, String title, String voiceUrl, String textContent, String pregnancyWeek);

    Integer addVoiceMemo(Integer userId, String title, String voiceUrl, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category);

    List<Voice> getVoiceByUserId(Integer userId);

    Boolean updateVoiceMemo(Integer memoId, String title, String voiceUrl, String textContent);

    // ========== 照片记录 ==========
    Integer addPhotoMemo(Integer userId, List<String> photoUrls, String title, String photoDescription, String pregnancyWeek);

    Integer addPhotoMemo(Integer userId, List<String> photoUrls, String title, String photoDescription, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category);

    List<Photo> getPhotoByUserId(Integer userId);

    Boolean updatePhotoMemo(Integer memoId, List<String> photoUrls, String photoDescription);

    // ========== 文件记录 ==========
    Integer addFileMemo(Integer userId, String title, String fileUrl, String pregnancyWeek);

    Integer addFileMemo(Integer userId, String title, String fileUrl, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category);

    List<File> getFileByUserId(Integer userId);

    Boolean updateFileMemo(Integer memoId, String title, String fileUrl);

    Boolean updateMemoVisibility(Integer memoId, Integer userId, String visibilityMode, String visibleTo);

    // ========== 通用查询 ==========
    List<Memo> getAllMemoByUserId(Integer userId);

    List<Memo> getAllMemoByUserIdPaged(Integer userId, Integer requestUserId, int limit, int offset);
}