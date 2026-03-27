const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const dataFilePath = path.join(__dirname, "data", "db.json");

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mini_erp",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
});

let activeDriver = process.env.DB_DRIVER === "json" ? "json" : "mysql";
let fallbackLogged = false;

const clone = (value) => JSON.parse(JSON.stringify(value));

const loadJsonData = () => {
  const raw = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(raw);
};

const saveJsonData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

const sortByKeys = (rows, comparators) =>
  [...rows].sort((left, right) => {
    for (const { key, direction = "asc" } of comparators) {
      const leftValue = left[key] ?? "";
      const rightValue = right[key] ?? "";

      if (leftValue === rightValue) {
        continue;
      }

      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
      });

      return direction === "desc" ? -comparison : comparison;
    }

    return 0;
  });

const findById = (collection, id) => collection.find((item) => item.id === id);

const executeJsonQuery = (sql, params = [], state) => {
  const text = sql.replace(/\s+/g, " ").trim();
  const db = state || loadJsonData();

  if (text === "SELECT id, name, email, password, role, employeeId FROM users WHERE email = ? LIMIT 1") {
    const email = params[0];
    return [[db.users.find((user) => user.email === email)].filter(Boolean), undefined];
  }

  if (text === "SELECT id FROM users WHERE email = ? LIMIT 1") {
    const email = params[0];
    const user = db.users.find((item) => item.email === email);
    return [user ? [{ id: user.id }] : [], undefined];
  }

  if (
    text ===
    "INSERT INTO users (id, name, email, password, role, employeeId) VALUES (?, ?, ?, ?, ?, ?)"
  ) {
    const [id, name, email, password, role, employeeId] = params;
    db.users.push({ id, name, email, password, role, employeeId });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (text === "SELECT * FROM employees ORDER BY name ASC") {
    return [sortByKeys(db.employees, [{ key: "name", direction: "asc" }]), undefined];
  }

  if (text === "SELECT * FROM employees WHERE id = ?") {
    return [db.employees.filter((item) => item.id === params[0]), undefined];
  }

  if (text === "SELECT * FROM employees WHERE id = ? LIMIT 1") {
    return [[findById(db.employees, params[0])].filter(Boolean), undefined];
  }

  if (text === "SELECT id, name, email FROM employees WHERE id = ? LIMIT 1") {
    const employee = findById(db.employees, params[0]);
    return [employee ? [{ id: employee.id, name: employee.name, email: employee.email }] : [], undefined];
  }

  if (text === "SELECT id, name, email FROM employees WHERE email = ? LIMIT 1") {
    const employee = db.employees.find((item) => item.email === params[0]);
    return [employee ? [{ id: employee.id, name: employee.name, email: employee.email }] : [], undefined];
  }

  if (
    text ===
    "INSERT INTO employees (id, name, email, phone, department, role, salary, joiningDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ) {
    const [id, name, email, phone, department, role, salary, joiningDate, status] = params;
    db.employees.push({ id, name, email, phone, department, role, salary, joiningDate, status });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (
    text ===
    "UPDATE employees SET name = ?, email = ?, phone = ?, department = ?, role = ?, salary = ?, joiningDate = ?, status = ? WHERE id = ?"
  ) {
    const employee = findById(db.employees, params[8]);
    if (!employee) {
      return [{ affectedRows: 0 }, undefined];
    }

    [employee.name, employee.email, employee.phone, employee.department, employee.role, employee.salary, employee.joiningDate, employee.status] =
      params.slice(0, 8);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "DELETE FROM employees WHERE id = ?") {
    const index = db.employees.findIndex((item) => item.id === params[0]);
    if (index === -1) {
      return [{ affectedRows: 0 }, undefined];
    }

    db.employees.splice(index, 1);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM attendance ORDER BY `date` DESC, employeeName ASC") {
    return [sortByKeys(db.attendance, [{ key: "date", direction: "desc" }, { key: "employeeName" }]), undefined];
  }

  if (
    text ===
    "SELECT * FROM attendance WHERE employeeId = ? ORDER BY `date` DESC, employeeName ASC"
  ) {
    const rows = db.attendance.filter((item) => item.employeeId === params[0]);
    return [sortByKeys(rows, [{ key: "date", direction: "desc" }, { key: "employeeName" }]), undefined];
  }

  if (
    text ===
    "INSERT INTO attendance (id, employeeId, employeeName, `date`, status, checkIn, checkOut) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ) {
    const [id, employeeId, employeeName, date, status, checkIn, checkOut] = params;
    db.attendance.push({ id, employeeId, employeeName, date, status, checkIn, checkOut });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (
    text ===
    "UPDATE attendance SET employeeId = ?, employeeName = ?, `date` = ?, status = ?, checkIn = ?, checkOut = ? WHERE id = ?"
  ) {
    const record = findById(db.attendance, params[6]);
    if (!record) {
      return [{ affectedRows: 0 }, undefined];
    }

    [record.employeeId, record.employeeName, record.date, record.status, record.checkIn, record.checkOut] =
      params.slice(0, 6);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM attendance WHERE id = ? LIMIT 1") {
    return [[findById(db.attendance, params[0])].filter(Boolean), undefined];
  }

  if (text === "DELETE FROM attendance WHERE id = ?") {
    const index = db.attendance.findIndex((item) => item.id === params[0]);
    if (index === -1) {
      return [{ affectedRows: 0 }, undefined];
    }

    db.attendance.splice(index, 1);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM leave_requests ORDER BY createdAt DESC, startDate DESC") {
    return [sortByKeys(db.leave_requests || db.leaveRequests || [], [
      { key: "createdAt", direction: "desc" },
      { key: "startDate", direction: "desc" },
    ]), undefined];
  }

  if (
    text ===
    "SELECT * FROM leave_requests WHERE employeeId = ? ORDER BY createdAt DESC, startDate DESC"
  ) {
    const source = db.leave_requests || db.leaveRequests || [];
    const rows = source.filter((item) => item.employeeId === params[0]);
    return [sortByKeys(rows, [{ key: "createdAt", direction: "desc" }, { key: "startDate", direction: "desc" }]), undefined];
  }

  if (
    text ===
    "INSERT INTO leave_requests (id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, reviewNote, reviewedBy, reviewedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ) {
    const sourceKey = db.leave_requests ? "leave_requests" : "leaveRequests";
    db[sourceKey] = db[sourceKey] || [];
    const [id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, reviewNote, reviewedBy, reviewedAt, createdAt] =
      params;
    db[sourceKey].push({
      id,
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      status,
      reviewNote,
      reviewedBy,
      reviewedAt,
      createdAt,
    });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (
    text ===
    "UPDATE leave_requests SET status = ?, reviewNote = ?, reviewedBy = ?, reviewedAt = ? WHERE id = ?"
  ) {
    const source = db.leave_requests || db.leaveRequests || [];
    const request = findById(source, params[4]);
    if (!request) {
      return [{ affectedRows: 0 }, undefined];
    }

    [request.status, request.reviewNote, request.reviewedBy, request.reviewedAt] = params.slice(0, 4);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM leave_requests WHERE id = ? LIMIT 1") {
    const source = db.leave_requests || db.leaveRequests || [];
    return [[findById(source, params[0])].filter(Boolean), undefined];
  }

  if (text === "DELETE FROM leave_requests WHERE id = ?") {
    const sourceKey = db.leave_requests ? "leave_requests" : "leaveRequests";
    db[sourceKey] = db[sourceKey] || [];
    const index = db[sourceKey].findIndex((item) => item.id === params[0]);
    if (index === -1) {
      return [{ affectedRows: 0 }, undefined];
    }

    db[sourceKey].splice(index, 1);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM tasks ORDER BY dueDate ASC, createdAt DESC") {
    return [sortByKeys(db.tasks, [{ key: "dueDate" }, { key: "createdAt", direction: "desc" }]), undefined];
  }

  if (text === "SELECT * FROM tasks WHERE assignedTo = ? ORDER BY dueDate ASC, createdAt DESC") {
    const rows = db.tasks.filter((item) => item.assignedTo === params[0]);
    return [sortByKeys(rows, [{ key: "dueDate" }, { key: "createdAt", direction: "desc" }]), undefined];
  }

  if (
    text ===
    "INSERT INTO tasks (id, title, description, assignedTo, assignedName, priority, status, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ) {
    const [id, title, description, assignedTo, assignedName, priority, status, dueDate, createdAt] =
      params;
    db.tasks.push({ id, title, description, assignedTo, assignedName, priority, status, dueDate, createdAt });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (text === "UPDATE tasks SET status = ? WHERE id = ?") {
    const task = findById(db.tasks, params[1]);
    if (!task) {
      return [{ affectedRows: 0 }, undefined];
    }

    task.status = params[0];
    return [{ affectedRows: 1 }, undefined];
  }

  if (
    text ===
    "UPDATE tasks SET title = ?, description = ?, assignedTo = ?, assignedName = ?, priority = ?, status = ?, dueDate = ? WHERE id = ?"
  ) {
    const task = findById(db.tasks, params[7]);
    if (!task) {
      return [{ affectedRows: 0 }, undefined];
    }

    [task.title, task.description, task.assignedTo, task.assignedName, task.priority, task.status, task.dueDate] =
      params.slice(0, 7);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM tasks WHERE id = ? LIMIT 1") {
    return [[findById(db.tasks, params[0])].filter(Boolean), undefined];
  }

  if (text === "DELETE FROM tasks WHERE id = ?") {
    const index = db.tasks.findIndex((item) => item.id === params[0]);
    if (index === -1) {
      return [{ affectedRows: 0 }, undefined];
    }

    db.tasks.splice(index, 1);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "SELECT * FROM payroll ORDER BY paidOn DESC, employeeName ASC") {
    return [sortByKeys(db.payroll, [{ key: "paidOn", direction: "desc" }, { key: "employeeName" }]), undefined];
  }

  if (text === "SELECT * FROM payroll WHERE employeeId = ? ORDER BY paidOn DESC, employeeName ASC") {
    const rows = db.payroll.filter((item) => item.employeeId === params[0]);
    return [sortByKeys(rows, [{ key: "paidOn", direction: "desc" }, { key: "employeeName" }]), undefined];
  }

  if (
    text ===
    "INSERT INTO payroll (id, employeeId, employeeName, month, basicSalary, bonus, deductions, netSalary, status, paidOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ) {
    const [id, employeeId, employeeName, month, basicSalary, bonus, deductions, netSalary, status, paidOn] =
      params;
    db.payroll.push({
      id,
      employeeId,
      employeeName,
      month,
      basicSalary,
      bonus,
      deductions,
      netSalary,
      status,
      paidOn,
    });
    return [{ affectedRows: 1, insertId: id }, undefined];
  }

  if (text === "SELECT * FROM payroll WHERE id = ? LIMIT 1") {
    return [[findById(db.payroll, params[0])].filter(Boolean), undefined];
  }

  if (
    text ===
    "UPDATE payroll SET employeeId = ?, employeeName = ?, month = ?, basicSalary = ?, bonus = ?, deductions = ?, netSalary = ?, status = ?, paidOn = ? WHERE id = ?"
  ) {
    const record = findById(db.payroll, params[9]);
    if (!record) {
      return [{ affectedRows: 0 }, undefined];
    }

    [
      record.employeeId,
      record.employeeName,
      record.month,
      record.basicSalary,
      record.bonus,
      record.deductions,
      record.netSalary,
      record.status,
      record.paidOn,
    ] = params.slice(0, 9);
    return [{ affectedRows: 1 }, undefined];
  }

  if (text === "DELETE FROM payroll WHERE id = ?") {
    const index = db.payroll.findIndex((item) => item.id === params[0]);
    if (index === -1) {
      return [{ affectedRows: 0 }, undefined];
    }

    db.payroll.splice(index, 1);
    return [{ affectedRows: 1 }, undefined];
  }

  throw new Error(`Unsupported JSON DB query: ${text}`);
};

const persistIfNeeded = (state, operationRan) => {
  if (state && operationRan) {
    saveJsonData(state);
  }
};

const runJsonQuery = async (sql, params = [], state) => {
  const targetState = state || loadJsonData();
  const [rows, meta] = executeJsonQuery(sql, params, targetState);
  const operationRan = /^(INSERT|UPDATE|DELETE)/i.test(sql.trim());
  persistIfNeeded(state ? null : targetState, operationRan);
  return [clone(rows), meta];
};

const useJsonFallback = (reason) => {
  activeDriver = "json";

  if (!fallbackLogged) {
    console.warn(`Falling back to JSON data store because MySQL is unavailable: ${reason}`);
    fallbackLogged = true;
  }
};

const shouldFallbackToJson = (error) =>
  ["ER_ACCESS_DENIED_ERROR", "ECONNREFUSED", "ER_BAD_DB_ERROR", "ENOENT"].includes(error?.code);

const query = async (sql, params = []) => {
  if (activeDriver === "json") {
    return runJsonQuery(sql, params);
  }

  try {
    return await mysqlPool.execute(sql, params);
  } catch (error) {
    if (!shouldFallbackToJson(error)) {
      throw error;
    }

    useJsonFallback(error.message);
    return runJsonQuery(sql, params);
  }
};

const createJsonConnection = () => {
  let workingCopy = loadJsonData();

  return {
    async execute(sql, params = []) {
      return runJsonQuery(sql, params, workingCopy);
    },
    async beginTransaction() {},
    async commit() {
      saveJsonData(workingCopy);
    },
    async rollback() {
      workingCopy = loadJsonData();
    },
    release() {},
  };
};

const pool = {
  async getConnection() {
    if (activeDriver === "json") {
      return createJsonConnection();
    }

    try {
      return await mysqlPool.getConnection();
    } catch (error) {
      if (!shouldFallbackToJson(error)) {
        throw error;
      }

      useJsonFallback(error.message);
      return createJsonConnection();
    }
  },
};

const testConnection = async () => {
  if (activeDriver === "json") {
    return;
  }

  try {
    const connection = await mysqlPool.getConnection();
    connection.release();
  } catch (error) {
    if (!shouldFallbackToJson(error)) {
      throw error;
    }

    useJsonFallback(error.message);
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
