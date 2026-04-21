CREATE TABLE inspect_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    farmer_id BIGINT NOT NULL,
    inspector_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    checklist_result JSON NOT NULL,
    photo_urls JSON DEFAULT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plan_id (plan_id),
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_inspector_id (inspector_id),
    UNIQUE KEY uk_plan_farmer_inspector (plan_id, farmer_id, inspector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
