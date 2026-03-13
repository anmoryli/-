package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文件记录实体类
 * 对应数据库中的file表，与备忘录是1:1关系，存储文件类型备忘录的具体信息
 */
@Data
public class File {
    /**
     * 文件记录ID，主键，自增
     */
    private Integer fileId;

    /**
     * 关联的备忘录ID，非空
     */
    private Integer memoId;

    /**
     * 文件记录标题，非空
     */
    private String title;

    /**
     * 文件URL，非空
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
     * 记录时的孕周（来自 memo 表 JOIN，仅查询时填充）
     */
    private String pregnancyWeek;
}