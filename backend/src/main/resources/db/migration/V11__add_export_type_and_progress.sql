-- Add export type and progress tracking to export_task
ALTER TABLE export_task
    ADD COLUMN export_type TINYINT NOT NULL DEFAULT 0 COMMENT '0=PDF报告(含照片), 1=照片ZIP',
    ADD COLUMN processed_count INT NOT NULL DEFAULT 0 COMMENT '已处理条数';

CREATE INDEX idx_export_task_plan_id ON export_task(plan_id);
