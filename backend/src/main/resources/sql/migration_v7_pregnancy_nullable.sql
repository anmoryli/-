-- migration_v7: 家庭成员无需怀孕日、预产期，pregnancy_time、last_menstrual_date 改为可空
-- 若已执行 migration_v6，请执行本迁移；若 migration_v6 已包含 MODIFY，则跳过。

use yunfu;

ALTER TABLE user MODIFY pregnancy_time datetime null comment '预产期，家庭成员可为空';
ALTER TABLE user MODIFY last_menstrual_date date null comment '末次月经日，家庭成员可为空';
