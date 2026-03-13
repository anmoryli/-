drop database if exists yunfu;
create database if not exists yunfu;
use yunfu;

drop table if exists user;
create table if not exists user (
    user_id int primary key auto_increment not null ,
    username varchar(255) not null ,
    password_hash varchar(255) not null comment '存储加密后的密码' ,
    avatar_url text null,
    email varchar(100) null comment '用户邮箱可空，后续绑定，用于找回密码和接收消息' ,
    last_menstrual_date date null comment '末次月经日/怀孕起算日，用于计算孕周' ,
    pregnancy_time datetime not null comment '预产期' ,
    created_at datetime default now() ,
    updated_at datetime default now() on update now()
);

drop table if exists memo;
create table if not exists memo (
    memo_id int primary key auto_increment not null ,
    user_id int not null ,
    type enum('text','voice','photo','file') not null default 'text',
    photo_title varchar(255) null comment '照片记录标题',
    photo_description text null,
    pregnancy_week varchar(255) comment '记录时的孕周',
    pregnancy_week_index int null comment '孕周索引（整数）',
    record_weight_kg decimal(5,2) null comment '记录时体重快照(kg)',
    tag varchar(50) null comment '标签，如letter_to_baby',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

-- 文字记录,1-1
drop table if exists text;
create table if not exists text (
    text_id int primary key auto_increment not null ,
    memo_id int not null ,
    title varchar(255) not null ,
    content text not null ,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade
);

-- 录音记录,1-1
drop table if exists voice;
create table if not exists voice (
    voice_id int primary key auto_increment not null ,
    memo_id int not null ,
    title varchar(255) not null ,
    url text not null comment '语音文件url',
    text_content text null comment '语音转文字内容，可以为空',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade
);

-- 文件记录,1-1
drop table if exists file;
create table if not exists file (
    file_id int primary key auto_increment not null ,
    memo_id int not null ,
    title varchar(255) not null ,
    url text not null comment '文件url',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade
);

-- 照片记录,1-n
drop table if exists photo;
create table if not exists photo (
    photo_id int primary key auto_increment not null ,
    memo_id int not null ,
    url text ,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade
);

-- 照片-备忘录关联表
drop table if exists memo_photo;
create table if not exists memo_photo (
    memo_photo_id int primary key auto_increment not null ,
    memo_id int not null ,
    photo_id int not null ,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade ,
    foreign key (photo_id) references photo(photo_id) on delete cascade
);

-- AI对话部分
create table if not exists conversation (
    conversation_id int not null primary key auto_increment,
    user_id int not null,
    memo_id int null comment '关联的记录，纯AI对话可为空',
    title varchar(255) not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user (user_id) on delete cascade
);

create table if not exists message (
    message_id int not null primary key auto_increment,
    conversation_id int not null,
    user_id int not null,
    content longtext not null,
    is_ai tinyint(1) default 0,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (conversation_id) references conversation (conversation_id) on delete cascade,
    foreign key (user_id) references user (user_id) on delete cascade
);

-- v2: 胎动、心情、宫缩、产检清单
create table if not exists user_daily_log (
    log_id int primary key auto_increment not null,
    user_id int not null,
    record_date date not null,
    kick_count int default 0,
    mood varchar(20) null,
    weight_kg decimal(5,2) null comment '体重(kg)',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade,
    unique key uk_user_date (user_id, record_date)
);

-- v9: AI 图生图社区模板
create table if not exists ai_template (
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

-- v9: AI 图生图社区作品流
create table if not exists ai_generation_post (
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

create table if not exists ai_generation_post_like (
    like_id int primary key auto_increment not null,
    post_id int not null,
    user_id int not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    unique key uk_post_user_like (post_id, user_id),
    foreign key (post_id) references ai_generation_post(post_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

create table if not exists ai_generation_post_comment (
    comment_id int primary key auto_increment not null,
    post_id int not null,
    user_id int not null,
    content text not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (post_id) references ai_generation_post(post_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

-- v9: 检查单提醒
create table if not exists check_report (
    report_id int primary key auto_increment not null,
    user_id int not null,
    file_url text not null comment '检查单文件URL',
    original_filename varchar(255) null comment '原始文件名',
    parsed_summary text null comment 'AI解析摘要',
    next_check_date date null comment '建议复查日期',
    email_sent tinyint(1) not null default 0 comment '是否已发送提醒邮件',
    last_send_at datetime null comment '上次发送时间',
    send_status varchar(30) null comment 'pending|sent|failed',
    retry_count int not null default 0 comment '提醒重试次数',
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (user_id) references user(user_id) on delete cascade
);

create table if not exists contraction (
    contraction_id int primary key auto_increment not null,
    user_id int not null,
    started_at datetime not null,
    duration_seconds int not null,
    created_at datetime default now(),
    foreign key (user_id) references user(user_id) on delete cascade
);
