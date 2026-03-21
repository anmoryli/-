use yunfu;
-- 情景演绎相关表（请在已存在 user、conversation 的库中执行，默认库名 yunfu）
-- 若使用其他库名，请先 USE your_db; 或把 yunfu 替换为你的库名。

-- 1. 情景模板表
CREATE TABLE IF NOT EXISTS scenario (
                                        scenario_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                                        title VARCHAR(100) NOT NULL COMMENT '情景标题',
                                        description VARCHAR(500) NULL COMMENT '情景描述',
                                        sort_order INT NOT NULL DEFAULT 0,
                                        opening_prompt_key VARCHAR(80) NULL COMMENT '开场白对应的 Prompt 模板 key',
                                        end_trigger_hint VARCHAR(200) NULL COMMENT '供 AI 判断情景结束的提示',
                                        created_at DATETIME DEFAULT NOW(),
                                        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- 2. 情景报告表
CREATE TABLE IF NOT EXISTS scenario_report (
                                               report_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                                               conversation_id INT NOT NULL,
                                               scenario_id INT NOT NULL,
                                               spouse_user_id INT NOT NULL COMMENT '配偶 userId',
                                               creator_user_id INT NOT NULL COMMENT '孕妇 userId',
                                               content LONGTEXT NULL COMMENT '报告正文',
                                               created_at DATETIME DEFAULT NOW(),
                                               FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id) ON DELETE CASCADE,
                                               FOREIGN KEY (scenario_id) REFERENCES scenario(scenario_id) ON DELETE CASCADE,
                                               FOREIGN KEY (spouse_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
                                               FOREIGN KEY (creator_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
                                               INDEX idx_spouse (spouse_user_id),
                                               INDEX idx_creator (creator_user_id)
);

-- 3. conversation 表若已存在但无 scenario_id，执行下面一句（按需取消注释）
ALTER TABLE conversation ADD COLUMN scenario_id INT NULL COMMENT '情景演绎时关联 scenario 表' AFTER memo_id;

-- 4. 内置情景初始数据（若 scenario 表已有数据可跳过）
INSERT INTO scenario (title, description, sort_order, opening_prompt_key, end_trigger_hint) VALUES
                                                                                                ('产检焦虑', '模拟产检前的紧张与担忧，练习如何安抚与陪伴', 1, 'scenario_opening', '产检话题自然结束、情绪平复'),
                                                                                                ('孕吐不适', '模拟孕吐或食欲不佳时的对话，练习关心与实用建议', 2, 'scenario_opening', '孕吐/饮食话题告一段落'),
                                                                                                ('情绪波动', '模拟孕期情绪低落或敏感时刻，练习共情与倾听', 3, 'scenario_opening', '情绪得到疏导或话题转换'),
                                                                                                ('胎动讨论', '模拟第一次胎动或日常胎动话题，练习分享喜悦', 4, 'scenario_opening', '胎动话题自然结束'),
                                                                                                ('睡前不适', '模拟睡前睡不着、抽筋等不适，练习安抚与陪伴', 5, 'scenario_opening', '睡眠话题结束'),
                                                                                                ('孕期饮食', '模拟对饮食禁忌、营养的疑问，练习理性建议', 6, 'scenario_opening', '饮食建议已给、话题结束');
