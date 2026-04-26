CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(30) NOT NULL COMMENT '用户名/登录账号',
  `password` varchar(60) NOT NULL COMMENT '密码（加密存储）',
  `real_name` varchar(20) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `role` varchar(30) NOT NULL DEFAULT 'inspector' COMMENT '用户角色',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态 0=禁用 1=正常',
  `need_reset_pwd` tinyint NOT NULL DEFAULT '1' COMMENT '是否强制修改密码：1=是 0=否',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统用户表';

INSERT INTO `sys_user` (`id`, `username`, `password`, `real_name`, `phone`, `role`, `status`, `need_reset_pwd`)
VALUES
	(1, 'admin', '$2a$10$6GMhiIiiwnFO5CuexhTpj.uKAkPpVYkeQNFCzBKyakwD/ndqxcVKq', '系统管理员', null, 'admin', 1, 0),
	(2, 'yanghehu', '$2a$10$EtFf4iLUkcZhymHYvPVV9O25lnEXDfzfW/zIMa3xLDF8Vn3gOiN9O', '杨合虎', '18181833656', 'admin', 1, 1);
