CREATE TABLE `inspect_plan` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `plan_group_id` BIGINT NOT NULL COMMENT '计划组ID(同组首行ID)',
  `plan_name` VARCHAR(30) NOT NULL COMMENT '计划名称',
  `project_id` BIGINT NOT NULL COMMENT '关联项目ID',
  `start_time` DATE NOT NULL COMMENT '开始日期',
  `end_time` DATE NOT NULL COMMENT '结束日期',
  `status` TINYINT(4) NOT NULL DEFAULT 0 COMMENT '状态: 0-未开始 1-进行中 2-已结束',
  `inverter_count` INT NOT NULL DEFAULT 0 COMMENT '逆变器总数',
  `inspected_count` INT NOT NULL DEFAULT 0 COMMENT '已巡检数',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_plan_group_id` (`plan_group_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='巡检计划表';
