-- migration_v6: 用户角色（孕妇本人 / 家庭成员）
-- 执行前请备份数据。
-- 家庭成员 pregnancy_time 可空，请同时执行 migration_v7_pregnancy_nullable.sql

use yunfu;

-- user 表增加 user_type
ALTER TABLE user ADD COLUMN user_type varchar(20) null default 'pregnant' comment 'pregnant|family_member';
