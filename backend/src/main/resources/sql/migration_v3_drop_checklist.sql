-- migration_v3: 删除产检清单功能
-- 产检清单在宝宝出生后仍显示，逻辑不合理，移除该功能。

use yunfu;

DROP TABLE IF EXISTS prenatal_checklist;
