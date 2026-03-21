-- 会话未读 AI 消息标记：破冰或 AI 回复时置 1，用户拉取历史或标记已读时置 0
USE yunfu;

ALTER TABLE conversation ADD COLUMN has_unread_ai TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否有用户未读的 AI 消息';
