-- migration_v4: 孕期小目标 - 目标模板、用户进度、成就徽章
-- 执行前请备份数据。

use yunfu;

-- 目标模板表
CREATE TABLE IF NOT EXISTS pregnancy_goal_template (
    template_id int primary key auto_increment not null,
    category varchar(20) not null comment 'record|behavior|milestone',
    track_key varchar(50) not null comment '用于识别统计维度',
    name varchar(100) not null,
    description varchar(255) null,
    target_value int not null default 1,
    unit varchar(20) null comment '条|天|次|封|张',
    points int not null default 0,
    sort_order int not null default 0,
    created_at datetime default now(),
    updated_at datetime default now() on update now()
);

-- 用户目标进度表
CREATE TABLE IF NOT EXISTS user_goal_progress (
    progress_id int primary key auto_increment not null,
    user_id int not null,
    template_id int not null,
    current_value int not null default 0,
    status varchar(20) not null default 'active' comment 'active|completed',
    completed_at datetime null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade,
    foreign key (template_id) references pregnancy_goal_template(template_id) on delete cascade,
    unique key uk_user_template (user_id, template_id)
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
    achievement_id int primary key auto_increment not null,
    user_id int not null,
    badge_key varchar(50) not null,
    badge_name varchar(100) not null,
    earned_at datetime default now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

-- 初始目标模板数据
INSERT INTO pregnancy_goal_template (category, track_key, name, description, target_value, unit, points, sort_order) VALUES
('record', 'daily_record', '每日记录1条', '今天记录一条孕期点滴', 1, '条', 5, 10),
('record', 'letters', '写满10封信', '给宝宝写满10封信', 10, '封', 50, 20),
('record', 'photos', '拍满50张照片', '累计拍摄50张孕期照片', 50, '张', 30, 30),
('behavior', 'streak_days', '连续记录7天', '连续7天每天至少记录一条', 7, '天', 40, 40),
('behavior', 'kicks', '胎动记录30次', '累计记录胎动30次', 30, '次', 25, 50),
('milestone', 'week20_record', '完成孕20周记录', '在孕20周时完成一次记录', 1, '次', 60, 60),
('milestone', 'first_letter', '第一次写信给宝宝', '完成第一封写给宝宝的信', 1, '封', 80, 70);
