CREATE TABLE `inspect_plan_project` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `plan_id` BIGINT NOT NULL COMMENT '关联计划ID',
  `project_id` BIGINT NOT NULL COMMENT '关联项目ID',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '该项目电站总数',
  `inspected_count` INT NOT NULL DEFAULT 0 COMMENT '该项目已巡检数',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_project` (`plan_id`, `project_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计划-项目关联表';
