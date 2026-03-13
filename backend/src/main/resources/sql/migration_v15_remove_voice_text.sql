-- migration_v15: 删除语音转文字功能，移除 text_content 和 duration_seconds 列
use yunfu;
ALTER TABLE voice DROP COLUMN text_content;
ALTER TABLE voice DROP COLUMN duration_seconds;
