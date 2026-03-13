use yunfu;

ALTER TABLE check_report
    ADD COLUMN retry_count int not null default 0 comment '提醒重试次数' AFTER send_status;

