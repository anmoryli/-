-- migration_v2: 胎动、心情、宫缩、产检清单、memo.tag
-- 执行前请备份数据。若表已存在可注释对应 CREATE / ALTER。

use yunfu;

-- user_daily_log: 用户每日日志（胎动 + 心情）
CREATE TABLE IF NOT EXISTS user_daily_log (
    log_id int primary key auto_increment not null,
    user_id int not null,
    record_date date not null,
    kick_count int default 0,
    mood varchar(20) null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade,
    unique key uk_user_date (user_id, record_date)
);

-- contraction: 宫缩记录
CREATE TABLE IF NOT EXISTS contraction (
    contraction_id int primary key auto_increment not null,
    user_id int not null,
    started_at datetime not null,
    duration_seconds int not null,
    created_at datetime default now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

-- prenatal_checklist: 产检清单勾选
CREATE TABLE IF NOT EXISTS prenatal_checklist (
    checklist_id int primary key auto_increment not null,
    user_id int not null,
    milestone_key varchar(50) not null,
    completed tinyint(1) default 0,
    completed_at datetime null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade,
    unique key uk_user_milestone (user_id, milestone_key)
);

-- memo 表增加 tag 列（若已存在请跳过此句）
ALTER TABLE memo ADD COLUMN tag varchar(50) null;
