-- migration_v21: 文章受众（孕妇/配偶/全部）
-- 执行前请备份数据。

use yunfu;

ALTER TABLE article ADD COLUMN audience varchar(20) DEFAULT 'all' COMMENT '受众: all=全部, pregnant=孕妇, spouse=配偶';
