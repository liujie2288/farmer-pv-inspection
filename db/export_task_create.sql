CREATE TABLE export_task (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL COMMENT '导出类型: photo / pdf',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0=排队中 1=解冻中 2=打包中 3=成功 4=失败',
  plan_id BIGINT NOT NULL COMMENT '关联巡检计划',
  project_id BIGINT NOT NULL COMMENT '关联项目',
  files JSON DEFAULT NULL COMMENT '导出文件列表',
  total_count INT DEFAULT NULL COMMENT '电站总数',
  fail_reason VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
  operator_id BIGINT NOT NULL COMMENT '操作人',
  finish_time DATETIME DEFAULT NULL COMMENT '打包完成时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_project (plan_id, project_id),
  INDEX idx_operator (operator_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='导出任务表';
