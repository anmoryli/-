-- migration_v14: 语音表增加时长字段，便于详情页展示
use yunfu;
ALTER TABLE voice
    ADD COLUMN duration_seconds int null comment '时长(秒)' AFTER text_content;
