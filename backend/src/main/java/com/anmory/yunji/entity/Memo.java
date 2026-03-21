package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 备忘录主表实体类
 * 对应数据库中的memo表，存储备忘录基础信息，关联不同类型的记录（文字/语音/照片/文件）
 */
@Data
public class Memo {
    /**
     * 备忘录ID，主键，自增
     */
    private Integer memoId;

    /**
     * 用户ID，关联用户表，非空
     */
    private Integer userId;

    /**
     * 备忘录类型，枚举值："text","voice","photo","file"，默认text，非空
     */
    private String type;

    /**
     * 照片标题，可空（主要用于photo类型备忘录）
     */
    private String photoTitle;

    /**
     * 照片描述，可为空（主要用于photo类型备忘录）
     */
    private String photoDescription;

    /**
     * 记录时的孕周  原本是没有找个字段 建表没录进来
     */
    private String pregnancyWeek;

    /**
     * 孕周索引（整数），用于稳定正序导出与查询
     */
    private Integer pregnancyWeekIndex;

    /**
     * 记录时体重快照（kg）
     */
    private Double recordWeightKg;

    /**
     * 标签，如 letter_to_baby（给宝宝的信）
     */
    private String tag;

    /**
     * 心情，如 happy、calm、tired
     */
    private String mood;

    /**
     * 可见模式：all=全部可见，allowlist=仅这些人可见，blocklist=仅这些人不可见
     */
    private String visibilityMode = "all";

    /**
     * 可见范围，逗号分隔的 userId。allowlist 时表示仅这些人可见；blocklist 时表示仅这些人不可见
     */
    private String visibleTo;

    /**
     * AI 打标签或手动分类，如「产检,心情,日记」（≤6字/标签，逗号分隔）
     */
    private String category;

    /**
     * 创建时间，默认当前时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间，默认当前时间，更新时自动刷新
     */
    private LocalDateTime updatedAt;
}