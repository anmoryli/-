use yunfu;

-- 评论增加 parent_comment_id（多层回复）
ALTER TABLE ai_generation_post_comment
    ADD COLUMN parent_comment_id int null AFTER post_id;

-- record_comment 如果存在也加（兼容）
ALTER TABLE record_comment
    ADD COLUMN parent_comment_id int null AFTER memo_id;

-- 评论点赞（社区）
CREATE TABLE IF NOT EXISTS ai_generation_post_comment_like (
    like_id int primary key auto_increment,
    comment_id int not null,
    user_id int not null,
    created_at datetime default now(),
    unique key uk_comment_user (comment_id, user_id),
    foreign key (comment_id) references ai_generation_post_comment(comment_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

-- 评论点赞（记录）
CREATE TABLE IF NOT EXISTS record_comment_like (
    like_id int primary key auto_increment,
    comment_id int not null,
    user_id int not null,
    created_at datetime default now(),
    unique key uk_comment_user (comment_id, user_id),
    foreign key (comment_id) references record_comment(comment_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);
