package com.anmory.yunji.service.impl;

import com.anmory.yunji.entity.File;
import com.anmory.yunji.entity.Memo;
import com.anmory.yunji.entity.Photo;
import com.anmory.yunji.entity.Text;
import com.anmory.yunji.entity.UserDailyLog;
import com.anmory.yunji.entity.Voice;
import com.anmory.yunji.mapper.FileMapper;
import com.anmory.yunji.mapper.MemoMapper;
import com.anmory.yunji.mapper.PhotoMapper;
import com.anmory.yunji.mapper.TextMapper;
import com.anmory.yunji.mapper.UserDailyLogMapper;
import com.anmory.yunji.mapper.VoiceMapper;
import com.anmory.yunji.service.FamilyService;
import com.anmory.yunji.service.GoalService;
import com.anmory.yunji.service.MemoService;
import com.anmory.yunji.utils.AliOssUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor // 构造器注入Mapper
public class MemoServiceImpl implements MemoService {

    private final MemoMapper memoMapper;
    private final TextMapper textMapper;
    private final VoiceMapper voiceMapper;
    private final PhotoMapper photoMapper;
    private final FileMapper fileMapper;
    private final GoalService goalService;
    private final FamilyService familyService;
    private final AliOssUtil aliOssUtil;
    private final UserDailyLogMapper userDailyLogMapper;

    // ========== 备忘录主表 ==========
    @Override
    public Integer addMemo(Memo memo) {
        memo.setPregnancyWeekIndex(parsePregnancyWeekIndex(memo.getPregnancyWeek()));
        memo.setRecordWeightKg(getTodayWeight(memo.getUserId()));
        memo.setCreatedAt(LocalDateTime.now());
        memo.setUpdatedAt(LocalDateTime.now());
        memoMapper.insertCompat(memo);
        return memo.getMemoId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean deleteMemo(Integer memoId) {
        // 1. 查询主记录获取类型
        Memo memo = memoMapper.selectByIdCompat(memoId);
        if (memo == null) {
            log.warn("备忘录不存在，memoId：{}", memoId);
            return false;
        }

        // 2. 查询并缓存待清理 OSS 资源
        List<String> urlsToDelete = new ArrayList<>();
        switch (memo.getType()) {
            case "voice":
                String voiceUrl = voiceMapper.selectVoiceUrlByMemoId(memoId);
                if (voiceUrl != null && !voiceUrl.isBlank()) urlsToDelete.add(voiceUrl);
                break;
            case "photo":
                List<String> photoUrls = photoMapper.selectPhotoUrlsByMemoId(memoId);
                if (photoUrls != null) {
                    for (String p : photoUrls) {
                        if (p != null && !p.isBlank()) urlsToDelete.add(p);
                    }
                }
                break;
            case "file":
                String fileUrl = fileMapper.selectFileUrlByMemoId(memoId);
                if (fileUrl != null && !fileUrl.isBlank()) urlsToDelete.add(fileUrl);
                break;
            default:
                break;
        }

        // 3. 级联删除关联表
        switch (memo.getType()) {
            case "text":
                textMapper.deleteByMemoId(memoId);
                break;
            case "voice":
                voiceMapper.deleteByMemoId(memoId);
                break;
            case "photo":
                photoMapper.deleteByMemoId(memoId);
                break;
            case "file":
                fileMapper.deleteByMemoId(memoId);
                break;
            default:
                log.warn("未知备忘录类型：{}", memo.getType());
        }

        // 4. 删除主记录
        memoMapper.deleteById(memoId);

        // 5. 删除 OSS 资源（失败不回滚 DB，但记录日志）
        for (String url : urlsToDelete) {
            try {
                aliOssUtil.deleteFile(url);
            } catch (Exception ex) {
                log.warn("删除 OSS 资源失败，memoId={}, url={}", memoId, url, ex);
            }
        }
        return true;
    }

    // ========== 文字记录 ==========
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek) {
        return addTextMemo(userId, title, content, pregnancyWeek, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek, String tag) {
        return addTextMemo(userId, title, content, pregnancyWeek, tag, null, "all", null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addTextMemo(Integer userId, String title, String content, String pregnancyWeek, String tag, String mood, String visibilityMode, String visibleTo, String category) {
        // 1. 新增主记录
        Memo memo = new Memo();
        memo.setUserId(userId);
        memo.setType("text");
        memo.setPregnancyWeek(pregnancyWeek);
        memo.setTag(tag);
        memo.setMood(mood);
        memo.setVisibilityMode(visibilityMode != null && !visibilityMode.isBlank() ? visibilityMode : "all");
        memo.setVisibleTo(visibleTo);
        memo.setCategory(category);
        Integer memoId = addMemo(memo);

        // 2. 新增文字记录
        Text text = new Text();
        text.setMemoId(memoId);
        text.setTitle(title);
        text.setContent(content);
        textMapper.insert(text);

        try {
            goalService.onRecordAdded(userId, tag, pregnancyWeek, 0);
        } catch (Exception e) {
            log.warn("GoalService.onRecordAdded failed", e);
        }
        return memoId;
    }

    @Override
    public Boolean updateTextMemo(Integer textId, String title, String content) {
        Text text = new Text();
        text.setTextId(textId);
        text.setTitle(title);
        text.setContent(content);
        int rows = textMapper.updateById(text);
        return rows > 0;
    }

    @Override
    public List<Text> getTextByUserId(Integer userId) {
        return textMapper.selectByUserId(userId);
    }

    @Override
    public Boolean updateMemoVisibility(Integer memoId, Integer userId, String visibilityMode, String visibleTo) {
        Memo memo = memoMapper.selectByIdCompat(memoId);
        if (memo == null || !memo.getUserId().equals(userId)) {
            return false;
        }
        String mode = (visibilityMode != null && !visibilityMode.isBlank()) ? visibilityMode : "all";
        return memoMapper.updateVisibility(memoId, mode, visibleTo) > 0;
    }

    // ========== 语音记录 ==========
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addVoiceMemo(Integer userId, String title, String voiceUrl, String textContent, String pregnancyWeek) {
        return addVoiceMemo(userId, title, voiceUrl, pregnancyWeek, null, "all", null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addVoiceMemo(Integer userId, String title, String voiceUrl, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category) {
        // 1. 新增主记录
        Memo memo = new Memo();
        memo.setUserId(userId);
        memo.setType("voice");
        memo.setPregnancyWeek(pregnancyWeek);
        memo.setMood(mood);
        memo.setVisibilityMode(visibilityMode != null && !visibilityMode.isBlank() ? visibilityMode : "all");
        memo.setVisibleTo(visibleTo);
        memo.setCategory(category != null && !category.isBlank() ? parseCategory(category) : "语音");
        Integer memoId = addMemo(memo);

        // 2. 新增语音记录
        Voice voice = new Voice();
        voice.setMemoId(memoId);
        voice.setTitle(title);
        voice.setUrl(voiceUrl);
        voiceMapper.insert(voice);

        try {
            goalService.onRecordAdded(userId, null, pregnancyWeek, 0);
        } catch (Exception e) {
            log.warn("GoalService.onRecordAdded failed", e);
        }
        return memoId;
    }

    @Override
    public List<Voice> getVoiceByUserId(Integer userId) {
        return voiceMapper.selectByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean updateVoiceMemo(Integer memoId, String title, String voiceUrl, String textContent) {
        String oldUrl = voiceMapper.selectVoiceUrlByMemoId(memoId);
        Voice voice = new Voice();
        voice.setMemoId(memoId);
        voice.setTitle(title);
        voice.setUrl(voiceUrl);
        boolean ok = voiceMapper.updateByMemoId(voice) > 0;
        if (ok && oldUrl != null && !oldUrl.isBlank() && !oldUrl.equals(voiceUrl)) {
            try {
                aliOssUtil.deleteFile(oldUrl);
            } catch (Exception ex) {
                log.warn("语音替换后删除旧 OSS 失败，memoId={}, url={}", memoId, oldUrl, ex);
            }
        }
        return ok;
    }

    // ========== 照片记录 ==========
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addPhotoMemo(Integer userId, List<String> photoUrls, String title, String photoDescription, String pregnancyWeek) {
        return addPhotoMemo(userId, photoUrls, title, photoDescription, pregnancyWeek, null, "all", null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addPhotoMemo(Integer userId, List<String> photoUrls, String title, String photoDescription, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category) {
        // 1. 新增主记录
        Memo memo = new Memo();
        memo.setUserId(userId);
        memo.setType("photo");
        memo.setPhotoTitle(title);
        memo.setPhotoDescription(photoDescription);
        memo.setPregnancyWeek(pregnancyWeek);
        memo.setMood(mood);
        memo.setVisibilityMode(visibilityMode != null && !visibilityMode.isBlank() ? visibilityMode : "all");
        memo.setVisibleTo(visibleTo);
        memo.setCategory(category != null && !category.isBlank() ? parseCategory(category) : "照片");
        Integer memoId = addMemo(memo);

        // 2. 批量新增照片记录（假设Photo实体包含memoId和photoUrl）
        for (String photoUrl : photoUrls) {
            Photo photo = new Photo();
            photo.setMemoId(memoId);
            photo.setUrl(photoUrl);
            photoMapper.insert(photo);
        }

        try {
            goalService.onRecordAdded(userId, null, pregnancyWeek, photoUrls.size());
        } catch (Exception e) {
            log.warn("GoalService.onRecordAdded failed", e);
        }
        return memoId;
    }

    @Override
    public List<Photo> getPhotoByUserId(Integer userId) {
        return photoMapper.selectByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean updatePhotoMemo(Integer memoId, List<String> photoUrls, String photoDescription) {
        Memo memo = memoMapper.selectByIdCompat(memoId);
        if (memo == null) return false;

        List<String> oldUrls = photoMapper.selectPhotoUrlsByMemoId(memoId);
        memo.setPhotoDescription(photoDescription);
        memo.setUpdatedAt(LocalDateTime.now());
        memoMapper.updateById(memo);

        if (photoUrls == null || photoUrls.isEmpty()) {
            // 仅更新描述，不替换图片
            return true;
        }

        photoMapper.deleteByMemoId(memoId);
        for (String url : photoUrls) {
            Photo photo = new Photo();
            photo.setMemoId(memoId);
            photo.setUrl(url);
            photoMapper.insert(photo);
        }

        if (oldUrls != null) {
            for (String oldUrl : oldUrls) {
                if (oldUrl == null || oldUrl.isBlank()) continue;
                if (!photoUrls.contains(oldUrl)) {
                    try {
                        aliOssUtil.deleteFile(oldUrl);
                    } catch (Exception ex) {
                        log.warn("照片替换后删除旧 OSS 失败，memoId={}, url={}", memoId, oldUrl, ex);
                    }
                }
            }
        }
        return true;
    }

    // ========== 文件记录 ==========
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addFileMemo(Integer userId, String title, String fileUrl, String pregnancyWeek) {
        return addFileMemo(userId, title, fileUrl, pregnancyWeek, null, "all", null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer addFileMemo(Integer userId, String title, String fileUrl, String pregnancyWeek, String mood, String visibilityMode, String visibleTo, String category) {
        // 1. 新增主记录
        Memo memo = new Memo();
        memo.setUserId(userId);
        memo.setType("file");
        memo.setPregnancyWeek(pregnancyWeek);
        memo.setMood(mood);
        memo.setVisibilityMode(visibilityMode != null && !visibilityMode.isBlank() ? visibilityMode : "all");
        memo.setVisibleTo(visibleTo);
        memo.setCategory(category != null && !category.isBlank() ? parseCategory(category) : "文件");
        Integer memoId = addMemo(memo);

        // 2. 新增文件记录
        File file = new File();
        file.setMemoId(memoId);
        file.setTitle(title != null ? title : "文件");
        file.setUrl(fileUrl);
        fileMapper.insert(file);

        try {
            goalService.onRecordAdded(userId, null, pregnancyWeek, 0);
        } catch (Exception e) {
            log.warn("GoalService.onRecordAdded failed", e);
        }
        return memoId;
    }

    @Override
    public List<File> getFileByUserId(Integer userId) {
        return fileMapper.selectByUserId(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean updateFileMemo(Integer memoId, String title, String fileUrl) {
        String oldUrl = fileMapper.selectFileUrlByMemoId(memoId);
        File file = new File();
        file.setMemoId(memoId);
        file.setTitle(title != null ? title : "文件");
        file.setUrl(fileUrl);
        boolean ok = fileMapper.updateByMemoId(file) > 0;
        if (ok && oldUrl != null && !oldUrl.isBlank() && !oldUrl.equals(fileUrl)) {
            try {
                aliOssUtil.deleteFile(oldUrl);
            } catch (Exception ex) {
                log.warn("文件替换后删除旧 OSS 失败，memoId={}, url={}", memoId, oldUrl, ex);
            }
        }
        return ok;
    }

    // ========== 通用查询 ==========
    @Override
    public List<Memo> getAllMemoByUserId(Integer userId) {
        return memoMapper.selectAllByUserIdCompat(userId);
    }

    @Override
    public List<Memo> getAllMemoByUserIdPaged(Integer userId, Integer requestUserId, int limit, int offset) {
        log.info("[可见范围] getAllMemoByUserIdPaged 请求 userId={} requestUserId={} limit={} offset={}", userId, requestUserId, limit, offset);
        List<Memo> list = memoMapper.selectAllByUserIdPagedCompat(userId, limit, offset);
        log.info("[可见范围] 从DB查得 {} 条记录", list != null ? list.size() : 0);
        if (requestUserId == null || requestUserId.equals(userId)) {
            log.info("[可见范围] 本人查看或 requestUserId 为空，返回全部 {} 条", list != null ? list.size() : 0);
            return list;
        }
        if (!familyService.canViewRecord(userId, requestUserId)) {
            log.info("[可见范围] requestUserId={} 与 userId={} 非同一家庭，返回 0 条", requestUserId, userId);
            return List.of();
        }
        List<Memo> filtered = list.stream()
                .filter(m -> isMemoVisibleTo(m, requestUserId))
                .collect(Collectors.toList());
        log.info("[可见范围] 过滤后可见 {} 条（原 {} 条）", filtered.size(), list.size());
        return filtered;
    }

    private boolean isMemoVisibleTo(Memo m, Integer requestUserId) {
        String mode = m.getVisibilityMode();
        if (mode == null || mode.isBlank()) mode = "all";
        if ("all".equals(mode)) {
            log.debug("[可见范围] memoId={} mode=all -> 可见", m.getMemoId());
            return true;
        }
        Set<Integer> ids = parseVisibleToIds(m.getVisibleTo());
        if ("allowlist".equals(mode)) {
            boolean visible = ids != null && ids.contains(requestUserId);
            log.info("[可见范围] memoId={} mode=allowlist visibleTo={} requestUserId={} -> {}", m.getMemoId(), m.getVisibleTo(), requestUserId, visible ? "可见" : "不可见");
            return visible;
        }
        if ("blocklist".equals(mode)) {
            boolean visible = ids == null || !ids.contains(requestUserId);
            log.info("[可见范围] memoId={} mode=blocklist visibleTo={} requestUserId={} -> {}", m.getMemoId(), m.getVisibleTo(), requestUserId, visible ? "可见" : "不可见");
            return visible;
        }
        log.debug("[可见范围] memoId={} mode={} 未知 -> 默认可见", m.getMemoId(), mode);
        return true;
    }

    private Set<Integer> parseVisibleToIds(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Set<Integer> result = new HashSet<>();
        for (String s : raw.split("[,;]")) {
            String t = s.trim().replaceAll("[\\[\\]\"]", "");
            if (t.isEmpty()) continue;
            try {
                result.add(Integer.parseInt(t));
            } catch (NumberFormatException ignored) {}
        }
        return result.isEmpty() ? null : result;
    }

    private Integer parsePregnancyWeekIndex(String pregnancyWeek) {
        if (pregnancyWeek == null || pregnancyWeek.isBlank()) return null;
        String digits = pregnancyWeek.replaceAll("\\D", "");
        if (digits.isEmpty()) return null;
        try {
            return Integer.parseInt(digits);
        } catch (Exception ignore) {
            return null;
        }
    }

    private Double getTodayWeight(Integer userId) {
        if (userId == null) return null;
        try {
            UserDailyLog udl = userDailyLogMapper.findByUserAndDate(userId, java.time.LocalDate.now());
            return udl != null ? udl.getWeightKg() : null;
        } catch (Exception ex) {
            log.debug("读取当日体重失败 userId={}", userId, ex);
            return null;
        }
    }

    /** 解析 category：中英文逗号、分号分隔，每标签≤6字，用英文逗号连接 */
    private String parseCategory(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String[] parts = raw.split("[,;，；]");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            String t = p.trim();
            if (t.isEmpty()) continue;
            if (t.length() > 6) t = t.substring(0, 6);
            if (sb.length() > 0) sb.append(",");
            sb.append(t);
        }
        return sb.length() > 0 ? sb.toString() : null;
    }
}