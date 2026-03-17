-- 扩大 weight_kg 列以支持更大范围（DECIMAL(5,2) 最大 999.99，改为 DECIMAL(6,2) 最大 9999.99）
ALTER TABLE pregnancy_weight_record MODIFY COLUMN weight_kg DECIMAL(6,2) NOT NULL;
