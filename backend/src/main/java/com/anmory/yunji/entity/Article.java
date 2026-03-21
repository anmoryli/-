package com.anmory.yunji.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 孕期科普文章
 * 对应 article 表
 */
@Data
public class Article {
    private Integer articleId;
    private String title;
    private String summary;
    private String content;
    private String coverUrl;
    private String category;
    private Integer sortOrder;
    private Boolean isPublished;
    /** 受众：all=全部, pregnant=孕妇, spouse=配偶 */
    private String audience = "all";
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
