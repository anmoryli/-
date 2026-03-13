-- 定时提醒/任务（意图识别为 REMINDER 时解析并写入）
USE yunfu;

CREATE TABLE IF NOT EXISTS scheduled_operation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content VARCHAR(500) NOT NULL COMMENT '提醒内容',
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'once' COMMENT 'daily=每天, once=仅一次',
    run_at DATETIME NULL COMMENT 'once 时执行时间',
    run_time VARCHAR(10) NULL COMMENT 'daily 时每日执行时间 HH:mm',
    next_run_at DATETIME NULL COMMENT '下次执行时间',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, done, cancelled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_next (user_id, next_run_at),
    INDEX idx_next_status (next_run_at, status)
);
