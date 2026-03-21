-- 多源异构数据处理：embed_task 嵌入任务表
-- 作为 MySQL 与 Milvus 向量库之间的数据桥梁，支持可追溯、可重试、可审计

CREATE TABLE IF NOT EXISTS embed_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    source VARCHAR(20) NOT NULL COMMENT 'memo|message|pdf|image_desc',
    source_id VARCHAR(50) NOT NULL COMMENT '对应业务表主键',
    action VARCHAR(10) NOT NULL DEFAULT 'upsert' COMMENT 'upsert|delete',
    text_snapshot TEXT NULL COMMENT '嵌入时的完整文本快照（delete 时可为空）',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending|processing|success|failed|waiting_enrich',
    retry_count INT NOT NULL DEFAULT 0,
    max_retry INT NOT NULL DEFAULT 3,
    error_msg VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at),
    INDEX idx_source (source, source_id),
    INDEX idx_user (user_id)
) COMMENT '向量库嵌入任务表，统一管理多源异构数据的嵌入与删除';
