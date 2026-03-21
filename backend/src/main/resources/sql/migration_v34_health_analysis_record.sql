-- AI 健康分析记录（体重/B超记录后自动生成并保存）
CREATE TABLE IF NOT EXISTS health_analysis_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    record_type VARCHAR(20) NOT NULL COMMENT 'weight|fetal',
    record_id BIGINT NULL COMMENT '关联 pregnancy_weight_record.id 或 fetal_ultrasound_record.id',
    gestation_week INT NULL,
    analysis_text TEXT NOT NULL COMMENT 'AI 生成的分析建议',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_har_user (user_id),
    INDEX idx_har_created (created_at DESC)
) COMMENT='健康分析记录';
