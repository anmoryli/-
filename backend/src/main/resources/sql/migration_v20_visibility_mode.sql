-- migration_v20: 记录可见范围模式（all | allowlist | blocklist）
-- 执行前请备份数据。

use yunfu;

ALTER TABLE memo ADD COLUMN visibility_mode varchar(20) DEFAULT 'all' COMMENT '可见模式: all=全部可见, allowlist=仅这些人可见, blocklist=仅这些人不可见';
