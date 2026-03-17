-- 心情记录表：支持一天多次记录，每次带时间戳
CREATE TABLE IF NOT EXISTS mood_record (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  user_id INT NOT NULL,
  record_date DATE NOT NULL,
  record_time TIME NOT NULL COMMENT '记录时刻',
  mood VARCHAR(30) NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='心情记录（一天可多次）';
