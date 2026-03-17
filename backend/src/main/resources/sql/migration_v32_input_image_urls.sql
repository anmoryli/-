ALTER TABLE ai_generation_post
    ADD COLUMN input_image_url TEXT NULL COMMENT '首图 URL 兼容' AFTER template_id;