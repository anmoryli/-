-- migration_v23: 用户表增加注册时选择的关系（用于加入家庭时预填）
use yunfu;
ALTER TABLE `user` ADD COLUMN default_relationship VARCHAR(50) NULL COMMENT '注册时选择的关系，如配偶、婆婆、妈妈，用于加入家庭时预填' AFTER user_type;
