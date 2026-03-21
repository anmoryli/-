-- 隐私设置：数据收集开关
ALTER TABLE user ADD COLUMN data_collection_enabled TINYINT(1) DEFAULT 0 COMMENT '是否允许匿名数据收集 0=否 1=是';
