-- 健康值、文章表
-- health_value: 0-100，存于 user_daily_log
-- article: 后台发布的孕期科普文章

ALTER TABLE user_daily_log ADD COLUMN health_value TINYINT NULL COMMENT '健康值 0-100';

CREATE TABLE IF NOT EXISTS article (
    article_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(500) NULL,
    content LONGTEXT NULL,
    cover_url VARCHAR(500) NULL,
    category VARCHAR(50) NULL COMMENT '如：产检,饮食,心情',
    sort_order INT DEFAULT 0,
    is_published TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);
