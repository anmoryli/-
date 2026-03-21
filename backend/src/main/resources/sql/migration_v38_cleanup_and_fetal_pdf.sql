-- 数据库整理：删除未使用表 + B超 PDF 上传支持
-- 1. 删除 memo_photo（无 Mapper，实际用 photo.memo_id 关联）
DROP TABLE IF EXISTS memo_photo;

-- 2. fetal_ultrasound_record 新增 file_url 存 B超 PDF 链接
ALTER TABLE fetal_ultrasound_record ADD COLUMN file_url VARCHAR(500) NULL COMMENT 'B超 PDF 文件 URL（上传解析模式）';
