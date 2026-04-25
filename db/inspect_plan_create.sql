CREATE TABLE `inspect_plan` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `plan_name` VARCHAR(30) NOT NULL COMMENT '计划名称',
  `start_time` DATE NOT NULL COMMENT '开始日期',
  `end_time` DATE NOT NULL COMMENT '结束日期',
  `status` TINYINT(4) NOT NULL DEFAULT 0 COMMENT '状态: 0-未开始 1-进行中 2-已结束',
  `creator_id` BIGINT NOT NULL COMMENT '创建人用户ID',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '电站总数',
  `inspected_count` INT NOT NULL DEFAULT 0 COMMENT '已巡检总数',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_creator_id` (`creator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='巡检计划表';
