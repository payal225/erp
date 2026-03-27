CREATE DATABASE IF NOT EXISTS mini_erp;
USE mini_erp;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  employeeId VARCHAR(16) NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  department VARCHAR(80) NOT NULL,
  role VARCHAR(20) NOT NULL,
  salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  joiningDate DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(16) PRIMARY KEY,
  employeeId VARCHAR(16) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  checkIn VARCHAR(10) NULL,
  checkOut VARCHAR(10) NULL,
  INDEX idx_attendance_employee (employeeId),
  INDEX idx_attendance_date (`date`)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(16) PRIMARY KEY,
  employeeId VARCHAR(16) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  leaveType VARCHAR(40) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  reviewNote TEXT NULL,
  reviewedBy VARCHAR(100) NULL,
  reviewedAt DATE NULL,
  createdAt DATE NOT NULL,
  INDEX idx_leave_employee (employeeId),
  INDEX idx_leave_status (status),
  INDEX idx_leave_dates (startDate, endDate)
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(16) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  assignedTo VARCHAR(16) NOT NULL,
  assignedName VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  dueDate DATE NOT NULL,
  createdAt DATE NOT NULL,
  INDEX idx_tasks_assigned (assignedTo),
  INDEX idx_tasks_due (dueDate)
);

CREATE TABLE IF NOT EXISTS payroll (
  id VARCHAR(16) PRIMARY KEY,
  employeeId VARCHAR(16) NOT NULL,
  employeeName VARCHAR(100) NOT NULL,
  month VARCHAR(30) NOT NULL,
  basicSalary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  bonus DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
  netSalary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  paidOn DATE NULL,
  INDEX idx_payroll_employee (employeeId)
);

INSERT INTO employees (id, name, email, phone, department, role, salary, joiningDate, status)
VALUES
  ('e1', 'Admin User', 'admin@erp.com', '9000000001', 'Management', 'admin', 80000, '2022-01-01', 'Active'),
  ('e2', 'Rahul Kumar', 'rahul@erp.com', '9000000002', 'Engineering', 'employee', 45000, '2023-03-15', 'Active'),
  ('e3', 'Payal Singh', 'payal@erp.com', '9000000003', 'HR', 'employee', 40000, '2023-06-01', 'Active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  phone = VALUES(phone),
  department = VALUES(department),
  role = VALUES(role),
  salary = VALUES(salary),
  joiningDate = VALUES(joiningDate),
  status = VALUES(status);

INSERT INTO users (id, name, email, password, role, employeeId)
VALUES
  ('u1', 'Admin User', 'admin@erp.com', '$2a$10$wa2H0jlaJnPbVXuJFc2pL.uz.HiErhG7sNG0xsz8JkrjKrMSavKI.', 'admin', 'e1'),
  ('u2', 'Rahul Kumar', 'rahul@erp.com', '$2a$10$40MzRDBIu5iX2MvlB5rOk.aNhJYxeSpCluPCPAVegOtNlp.w/k98u', 'employee', 'e2')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password = VALUES(password),
  role = VALUES(role),
  employeeId = VALUES(employeeId);

INSERT INTO leave_requests (
  id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, reviewNote, reviewedBy, reviewedAt, createdAt
)
VALUES
  ('l1', 'e2', 'Rahul Kumar', 'Casual', '2026-03-29', '2026-03-30', 'Family event', 'Pending', NULL, NULL, NULL, '2026-03-25'),
  ('l2', 'e3', 'Payal Singh', 'Sick', '2026-03-22', '2026-03-23', 'Medical rest', 'Approved', 'Approved for recovery.', 'Admin User', '2026-03-21', '2026-03-20')
ON DUPLICATE KEY UPDATE
  employeeId = VALUES(employeeId),
  employeeName = VALUES(employeeName),
  leaveType = VALUES(leaveType),
  startDate = VALUES(startDate),
  endDate = VALUES(endDate),
  reason = VALUES(reason),
  status = VALUES(status),
  reviewNote = VALUES(reviewNote),
  reviewedBy = VALUES(reviewedBy),
  reviewedAt = VALUES(reviewedAt),
  createdAt = VALUES(createdAt);

INSERT INTO attendance (id, employeeId, employeeName, `date`, status, checkIn, checkOut)
VALUES
  ('a1', 'e2', 'Rahul Kumar', '2026-03-24', 'Present', '09:05', '18:00'),
  ('a2', 'e3', 'Payal Singh', '2026-03-24', 'Absent', '', '')
ON DUPLICATE KEY UPDATE
  employeeId = VALUES(employeeId),
  employeeName = VALUES(employeeName),
  `date` = VALUES(`date`),
  status = VALUES(status),
  checkIn = VALUES(checkIn),
  checkOut = VALUES(checkOut);

INSERT INTO tasks (id, title, description, assignedTo, assignedName, priority, status, dueDate, createdAt)
VALUES
  ('t1', 'Fix login bug', 'Resolve JWT expiry issue', 'e2', 'Rahul Kumar', 'High', 'Done', '2026-03-28', '2026-03-20'),
  ('t2', 'Prepare HR report', 'Monthly HR report for March 2026', 'e3', 'Payal Singh', 'Medium', 'Pending', '2026-03-31', '2026-03-21')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  assignedTo = VALUES(assignedTo),
  assignedName = VALUES(assignedName),
  priority = VALUES(priority),
  status = VALUES(status),
  dueDate = VALUES(dueDate),
  createdAt = VALUES(createdAt);

INSERT INTO payroll (id, employeeId, employeeName, month, basicSalary, bonus, deductions, netSalary, status, paidOn)
VALUES
  ('p1', 'e2', 'Rahul Kumar', 'March 2026', 45000, 2000, 1500, 45500, 'Paid', '2026-03-25'),
  ('p2', 'e3', 'Payal Singh', 'March 2026', 40000, 1000, 1000, 40000, 'Pending', NULL)
ON DUPLICATE KEY UPDATE
  employeeId = VALUES(employeeId),
  employeeName = VALUES(employeeName),
  month = VALUES(month),
  basicSalary = VALUES(basicSalary),
  bonus = VALUES(bonus),
  deductions = VALUES(deductions),
  netSalary = VALUES(netSalary),
  status = VALUES(status),
  paidOn = VALUES(paidOn);
