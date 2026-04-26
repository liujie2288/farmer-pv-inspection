CREATE TABLE `export_task` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `plan_id` BIGINT NOT NULL COMMENT '关联巡检计划ID',
  `operator_id` BIGINT NOT NULL COMMENT '操作人用户ID',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '导出状态: 0-处理中 1-已完成 2-失败',
  `file_url` VARCHAR(500) DEFAULT NULL COMMENT '下载链接',
  `file_size` BIGINT DEFAULT NULL COMMENT '文件大小(bytes)',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '导出总份数',
  `export_type` TINYINT NOT NULL DEFAULT 0 COMMENT '导出类型: 0-PDF报告ZIP 1-照片ZIP',
  `processed_count` INT NOT NULL DEFAULT 0 COMMENT '已处理数',
  `error_message` VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `complete_time` DATETIME DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='导出任务表';
