-- migration_v17: 家庭成员角色细化、记录心情/可见范围/category
-- 执行前请备份数据。

use yunfu;

-- 2.1 家庭成员角色细化
ALTER TABLE family_member ADD COLUMN relationship varchar(50) null comment '与孕妇关系，如老公、婆婆、妈妈等，支持自定义';
ALTER TABLE family_member ADD COLUMN is_spouse tinyint(1) null default 0 comment '是否配偶，1=是，注册后可异步LLM判断';

-- 2.2 记录心情与可见范围
ALTER TABLE memo ADD COLUMN mood varchar(20) null comment '记录心情';
ALTER TABLE memo ADD COLUMN visible_to text null comment '可见范围，JSON或逗号分隔member_id，空表示全部可见';

-- 2.3 记录分类（AI打标签）
ALTER TABLE memo ADD COLUMN category varchar(200) null comment 'AI标签，如产检,心情,日记，≤6字/标签，逗号分隔';
