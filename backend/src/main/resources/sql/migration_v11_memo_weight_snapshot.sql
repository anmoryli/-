use yunfu;

ALTER TABLE memo
    ADD COLUMN record_weight_kg decimal(5,2) null comment '记录时体重快照(kg)' AFTER pregnancy_week_index;

