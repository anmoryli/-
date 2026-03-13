-- migration_v9: 孕周化与AI社区基础能力
use yunfu;

-- 1) 每日日志补充体重
ALTER TABLE user_daily_log
    ADD COLUMN weight_kg decimal(5,2) null comment '体重(kg)' AFTER mood;

-- 2) memo 增加孕周索引，便于稳定排序（第1周在前）
ALTER TABLE memo
    ADD COLUMN pregnancy_week_index int null comment '孕周索引（整数）' AFTER pregnancy_week;

-- 3) AI 模板表
CREATE TABLE IF NOT EXISTS ai_template (
    template_id int primary key auto_increment not null,
    user_id int not null,
    title varchar(120) not null comment '模板标题',
    prompt_text text not null comment '模板提示词',
    category varchar(50) null comment '分类',
    cover_image_url text null comment '封面图',
    is_public tinyint(1) not null default 0 comment '是否公开',
    usage_count int not null default 0 comment '使用次数',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

-- 4) AI 图生图作品流
CREATE TABLE IF NOT EXISTS ai_generation_post (
    post_id int primary key auto_increment not null,
    user_id int not null,
    template_id int null,
    input_image_url text not null comment '输入图',
    output_image_url text not null comment '输出图',
    prompt_text text not null comment '生成时提示词快照',
    is_public tinyint(1) not null default 0 comment '是否公开到社区',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade,
    foreign key (template_id) references ai_template(template_id) on delete set null
);

-- 5) 检查单提醒
CREATE TABLE IF NOT EXISTS check_report (
    report_id int primary key auto_increment not null,
    user_id int not null,
    file_url text not null comment '检查单文件URL',
    original_filename varchar(255) null comment '原始文件名',
    parsed_summary text null comment 'AI解析摘要',
    next_check_date date null comment '建议复查日期',
    email_sent tinyint(1) not null default 0 comment '是否已发送提醒邮件',
    last_send_at datetime null comment '上次发送时间',
    send_status varchar(30) null comment 'pending|sent|failed',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

