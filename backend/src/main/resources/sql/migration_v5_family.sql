-- migration_v5: 家人共享 - 家庭、邀请、评论、点赞
-- 执行前请备份数据。

use yunfu;

-- user 表增加分享范围
ALTER TABLE user ADD COLUMN share_scope varchar(20) null default 'all' comment 'all|letters|photos';

-- 家庭表
CREATE TABLE IF NOT EXISTS family (
    family_id int primary key auto_increment not null,
    creator_user_id int not null,
    invite_code varchar(10) not null,
    invite_expires_at datetime not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (creator_user_id) references user(user_id) on delete cascade
);

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_member (
    member_id int primary key auto_increment not null,
    family_id int not null,
    user_id int not null,
    role varchar(20) not null default 'member' comment 'creator|member',
    joined_at datetime default now(),
    foreign key (family_id) references family(family_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade,
    unique key uk_family_user (family_id, user_id)
);

-- 记录评论表
CREATE TABLE IF NOT EXISTS record_comment (
    comment_id int primary key auto_increment not null,
    memo_id int not null,
    user_id int not null,
    content text not null,
    created_at datetime default now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

-- 记录点赞表
CREATE TABLE IF NOT EXISTS record_like (
    like_id int primary key auto_increment not null,
    memo_id int not null,
    user_id int not null,
    created_at datetime default now(),
    foreign key (memo_id) references memo(memo_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade,
    unique key uk_memo_user (memo_id, user_id)
);
