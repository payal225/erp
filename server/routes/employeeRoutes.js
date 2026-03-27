const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] =
      req.user.role === "admin"
        ? await query("SELECT * FROM employees ORDER BY name ASC")
        : await query("SELECT * FROM employees WHERE id = ?", [req.user.employeeId]);

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM employees WHERE id = ? LIMIT 1", [req.params.id]);
    const employee = rows[0];

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.json(employee);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/", verifyToken, adminOnly, async (req, res) => {
  const employee = {
    id: `e${uuidv4().slice(0, 6)}`,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    department: req.body.department,
    role: req.body.role || "employee",
    salary: Number(req.body.salary || 0),
    joiningDate: req.body.joiningDate,
    status: req.body.status || "Active",
  };

  try {
    await query(
      `INSERT INTO employees
        (id, name, email, phone, department, role, salary, joiningDate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee.id,
        employee.name,
        employee.email,
        employee.phone,
        employee.department,
        employee.role,
        employee.salary,
        employee.joiningDate,
        employee.status,
      ]
    );

    return res.status(201).json(employee);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [result] = await query(
      `UPDATE employees
       SET name = ?, email = ?, phone = ?, department = ?, role = ?, salary = ?, joiningDate = ?, status = ?
       WHERE id = ?`,
      [
        req.body.name,
        req.body.email,
        req.body.phone,
        req.body.department,
        req.body.role,
        Number(req.body.salary || 0),
        req.body.joiningDate,
        req.body.status,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const [rows] = await query("SELECT * FROM employees WHERE id = ? LIMIT 1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [result] = await query("DELETE FROM employees WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.json({ message: "Employee deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
