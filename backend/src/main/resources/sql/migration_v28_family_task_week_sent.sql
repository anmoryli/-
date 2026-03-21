-- migration_v28: 生成本周任务按家庭+孕周去重
use yunfu;

CREATE TABLE IF NOT EXISTS family_task_week_sent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  pregnancy_week INT NOT NULL COMMENT '孕周',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_family_week (family_id, pregnancy_week),
  INDEX idx_family (family_id)
) COMMENT '本周任务已发送记录（每家庭每孕周仅可生成一次）';
