-- Default admin user: admin / admin123
-- Password is MD5('admin123') = 0192023a7bbd73250516f069df18b500
INSERT INTO sys_user (username, password, real_name, role, status, first_login)
VALUES ('admin', '0192023a7bbd73250516f069df18b500', '系统管理员', 'admin', 1, 1);
