-- migration_v25: 站内通知 + 家庭任务（爸爸成长营）
use yunfu;

-- 站内通知
CREATE TABLE IF NOT EXISTS user_notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '接收用户',
  type VARCHAR(32) NOT NULL DEFAULT 'system' COMMENT '类型: task_assigned, system',
  title VARCHAR(200) NOT NULL,
  body TEXT NULL,
  related_task_id INT NULL COMMENT '关联家庭任务 id',
  read_at DATETIME NULL COMMENT '已读时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_read (user_id, read_at),
  INDEX idx_user_created (user_id, created_at)
) COMMENT '站内通知';

-- 家庭任务（爸爸成长营）
CREATE TABLE IF NOT EXISTS family_task (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  assignee_user_id INT NOT NULL COMMENT '执行人',
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  task_type VARCHAR(32) NOT NULL DEFAULT 'routine' COMMENT 'routine=常规, emotion=情感连接',
  pregnancy_week INT NULL COMMENT '适用孕周，可选',
  due_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, completed',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family (family_id),
  INDEX idx_assignee (assignee_user_id),
  INDEX idx_assignee_status (assignee_user_id, status)
) COMMENT '家庭任务';
