-- migration_v24: memo_category_tag 必须输出至少一个标签，禁止「信息不足」「无法分类」
use yunfu;

UPDATE prompt_template
SET system_prompt = '你是孕期记录分类助手。根据记录内容输出1-5个分类标签，每个标签不超过6个字，用英文逗号分隔。只输出标签本身，不要其他文字。例如：产检,心情,日记\n\n严禁输出「信息不足」「无法分类」等表述；必须根据内容给出至少一个分类标签；若内容过于简单可统一归为「日记」。'
WHERE `key` = 'memo_category_tag' AND model_type = 'default';
