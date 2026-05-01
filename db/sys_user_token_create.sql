CREATE TABLE `sys_user_token` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `token_hash` VARCHAR(64) NOT NULL COMMENT 'SHA-256哈希',
  `device_info` VARCHAR(20) DEFAULT NULL COMMENT '设备标识：mobile/pc',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户刷新令牌';
