CREATE TABLE `project` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `project_name` varchar(100) NOT NULL COMMENT '项目名称',
  `property_company` varchar(100) NOT NULL COMMENT '产权公司',
  `station_type` varchar(50) NOT NULL COMMENT '电站类型',
  `province` varchar(10) DEFAULT NULL COMMENT '省份',
  `city` varchar(20) DEFAULT NULL COMMENT '城市',
  `drone_certificate_url` varchar(255) DEFAULT NULL COMMENT '民用无人机驾驶合格证图片地址',
  `special_operation_cert_url` varchar(255) DEFAULT NULL COMMENT '特种作业操作证图片地址',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_name` (`project_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='项目表';
