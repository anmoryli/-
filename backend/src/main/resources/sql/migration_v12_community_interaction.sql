use yunfu;

CREATE TABLE IF NOT EXISTS ai_generation_post_like (
    like_id int primary key auto_increment not null,
    post_id int not null,
    user_id int not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    unique key uk_post_user_like (post_id, user_id),
    foreign key (post_id) references ai_generation_post(post_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS ai_generation_post_comment (
    comment_id int primary key auto_increment not null,
    post_id int not null,
    user_id int not null,
    content text not null,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    foreign key (post_id) references ai_generation_post(post_id) on delete cascade,
    foreign key (user_id) references user(user_id) on delete cascade
);

