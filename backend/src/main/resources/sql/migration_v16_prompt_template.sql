-- migration_v16: 提示词模板表，用于统一管理 AI 提示词
use yunfu;
CREATE TABLE IF NOT EXISTS prompt_template (
    id INT PRIMARY KEY AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL COMMENT '提示词键名，如 ai_chat_system',
    model_type VARCHAR(50) NOT NULL DEFAULT 'default' COMMENT '模型类型，用于区分不同模型',
    system_prompt TEXT NULL COMMENT '系统角色提示词',
    user_prompt_template TEXT NULL COMMENT '用户提示词模板，支持 {placeholder}',
    created_at DATETIME DEFAULT NOW(),
    UNIQUE KEY uk_key_model (`key`, model_type)
) COMMENT 'AI 提示词模板';
