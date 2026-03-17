CREATE TABLE IF NOT EXISTS `relax_music` (
  `music_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL COMMENT '音乐标题',
  `artist` VARCHAR(100) DEFAULT NULL COMMENT '艺术家/来源',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '描述说明',
  `category` VARCHAR(50) NOT NULL DEFAULT 'healing' COMMENT '分类: healing=疗愈音乐, recommend=推荐聆听',
  `tags` VARCHAR(300) DEFAULT NULL COMMENT '标签，逗号分隔，如: 钢琴,助眠,白噪音',
  `file_url` VARCHAR(500) NOT NULL COMMENT '音频文件OSS地址',
  `cover_url` VARCHAR(500) DEFAULT NULL COMMENT '封面图OSS地址',
  `duration_seconds` INT DEFAULT NULL COMMENT '音频时长(秒)',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重(越小越靠前)',
  `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用 0=禁用 1=启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_enabled_sort` (`is_enabled`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='放松音乐';
