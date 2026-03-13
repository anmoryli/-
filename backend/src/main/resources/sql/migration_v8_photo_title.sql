-- migration_v8: 照片记录标题
-- 为 memo 表增加 photo_title，用于照片记录独立标题展示

use yunfu;

ALTER TABLE memo
    ADD COLUMN photo_title varchar(255) null comment '照片记录标题' AFTER type;
