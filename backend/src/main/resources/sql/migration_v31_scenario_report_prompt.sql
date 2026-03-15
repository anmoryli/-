-- migration_v31: 情景演绎报告提示词（与 pregnancy.json 中 scenario_report 一致，DB 优先时也有数据）
USE yunfu;

INSERT IGNORE INTO prompt_template (`key`, model_type, system_prompt, user_prompt_template, created_at) VALUES
('scenario_report', 'default',
 '你是孕期宝情景演绎报告助手。根据配偶与扮演孕妇（妻子）的对话内容，生成一份温暖、简洁的情景报告（Markdown 格式），包含：1) 情景概述 2) 对话要点 3) 对配偶的建议与共情总结。帮助配偶回顾与反思。',
 '情景名称：{scenarioTitle}。孕周：{week}。妻子（对话中）：{momName}。\n\n以下是情景演绎的对话内容：\n\n{conversation}\n\n请根据以上对话生成一份简短的情景报告（Markdown），包含：情景概述、对话要点、对配偶的建议与共情总结。',
 NOW());
