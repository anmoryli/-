-- 用户偏好：社区开关（默认关闭）+ 邮件开关（默认开启）
ALTER TABLE `user`
    ADD COLUMN community_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否启用社区功能 0=否 1=是',
    ADD COLUMN email_enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否接收邮箱消息 0=否 1=是';

-- 孕妇体重记录（私密健康档案）
CREATE TABLE IF NOT EXISTS pregnancy_weight_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    record_date DATE NOT NULL,
    gestation_week INT NULL COMMENT '孕周（可空：若不填则后端可按末次月经/预产期推算）',
    weight_kg DECIMAL(5,2) NOT NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pwr_user_date (user_id, record_date)
) COMMENT='孕期体重记录';

-- 胎儿B超指标记录（私密健康档案）
CREATE TABLE IF NOT EXISTS fetal_ultrasound_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    record_date DATE NOT NULL,
    gestation_week INT NULL COMMENT '孕周',
    bpd_mm DECIMAL(6,2) NULL,
    hc_mm DECIMAL(6,2) NULL,
    ac_mm DECIMAL(6,2) NULL,
    fl_mm DECIMAL(6,2) NULL,
    efw_g INT NULL COMMENT '预估胎儿体重(g)',
    note VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fur_user_date (user_id, record_date)
) COMMENT='胎儿B超指标记录';

