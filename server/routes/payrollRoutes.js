const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

const toNumber = (value) => Number(value ?? 0);

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] =
      req.user.role === "admin"
        ? await query("SELECT * FROM payroll ORDER BY paidOn DESC, employeeName ASC")
        : await query(
            "SELECT * FROM payroll WHERE employeeId = ? ORDER BY paidOn DESC, employeeName ASC",
            [req.user.employeeId]
          );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/", verifyToken, adminOnly, async (req, res) => {
  const record = {
    id: `p${uuidv4().slice(0, 6)}`,
    employeeId: req.body.employeeId,
    employeeName: req.body.employeeName,
    month: req.body.month,
    basicSalary: toNumber(req.body.basicSalary),
    bonus: toNumber(req.body.bonus),
    deductions: toNumber(req.body.deductions),
    status: req.body.status || "Pending",
    paidOn: req.body.paidOn || null,
  };

  record.netSalary = record.basicSalary + record.bonus - record.deductions;

  try {
    await query(
      `INSERT INTO payroll
        (id, employeeId, employeeName, month, basicSalary, bonus, deductions, netSalary, status, paidOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.employeeId,
        record.employeeName,
        record.month,
        record.basicSalary,
        record.bonus,
        record.deductions,
        record.netSalary,
        record.status,
        record.paidOn,
      ]
    );

    return res.status(201).json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM payroll WHERE id = ? LIMIT 1", [req.params.id]);
    const current = rows[0];

    if (!current) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    const record = {
      employeeId: req.body.employeeId ?? current.employeeId,
      employeeName: req.body.employeeName ?? current.employeeName,
      month: req.body.month ?? current.month,
      basicSalary: toNumber(req.body.basicSalary ?? current.basicSalary),
      bonus: toNumber(req.body.bonus ?? current.bonus),
      deductions: toNumber(req.body.deductions ?? current.deductions),
      status: req.body.status ?? current.status,
      paidOn:
        Object.prototype.hasOwnProperty.call(req.body, "paidOn")
          ? req.body.paidOn || null
          : current.paidOn || null,
    };

    record.netSalary = record.basicSalary + record.bonus - record.deductions;

    await query(
      `UPDATE payroll
       SET employeeId = ?, employeeName = ?, month = ?, basicSalary = ?, bonus = ?, deductions = ?, netSalary = ?, status = ?, paidOn = ?
       WHERE id = ?`,
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
        req.params.id,
      ]
    );

    const [updatedRows] = await query("SELECT * FROM payroll WHERE id = ? LIMIT 1", [req.params.id]);
    return res.json(updatedRows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [result] = await query("DELETE FROM payroll WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    return res.json({ message: "Payroll record deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
