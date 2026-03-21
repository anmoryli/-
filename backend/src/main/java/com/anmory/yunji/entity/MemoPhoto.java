package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 备忘录-照片关联表实体类
 * 对应数据库中的memo_photo表，用于关联备忘录和照片（解决1:N关联关系）
 */
@Data
public class MemoPhoto {
    /**
     * 关联记录ID，主键，自增
     */
    private Integer memoPhotoId;

    /**
     * 备忘录ID，非空
     */
    private Integer memoId;

    /**
     * 照片ID，非空
     */
    private Integer photoId;

    /**
     * 创建时间，默认当前时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间，默认当前时间，更新时自动刷新
     */
    private LocalDateTime updatedAt;
}