CREATE TABLE export_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    operator_id BIGINT NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    file_url VARCHAR(500) DEFAULT NULL,
    file_size BIGINT DEFAULT NULL,
    total_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(500) DEFAULT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    complete_time DATETIME DEFAULT NULL,
    INDEX idx_operator_id (operator_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
