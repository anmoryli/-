package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 照片记录实体类
 * 对应数据库中的photo表，与备忘录是1:N关系，存储照片的URL信息
 */
@Data
public class Photo {
    /**
     * 照片ID，主键，自增
     */
    private Integer photoId;

    /**
     * 关联的备忘录ID，非空
     */
    private Integer memoId;

    /**
     * 照片URL
     */
    private String url;

    /**
     * 创建时间，默认当前时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间，默认当前时间，更新时自动刷新
     */
    private LocalDateTime updatedAt;

    /**
     * 照片描述（来自 memo 表 JOIN，仅查询时填充）
     */
    private String photoDescription;

    /**
     * 记录时的孕周（来自 memo 表 JOIN，仅查询时填充）
     */
    private String pregnancyWeek;
}