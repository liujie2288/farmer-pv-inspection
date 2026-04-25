-- ============================================================
-- 巡检大项表 (6条固定记录)
-- ============================================================
CREATE TABLE `inspect_section` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `section_no` TINYINT(4) unsigned NOT NULL COMMENT '大项序号(1-6)，同时用于排序',
  `section_name` VARCHAR(30) NOT NULL COMMENT '大项名称',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_section_no` (`section_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='巡检大项表';

INSERT INTO `inspect_section` (`id`,`section_no`, `section_name`) VALUES
(1,1, '光伏组件'),
(2,2, '支架'),
(3,3, '逆变器'),
(4,4, '配电箱'),
(5,5, '接地与防雷系统'),
(6,6, '采集装置及电缆');
