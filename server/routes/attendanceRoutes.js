const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] =
      req.user.role === "admin"
        ? await query("SELECT * FROM attendance ORDER BY `date` DESC, employeeName ASC")
        : await query(
            "SELECT * FROM attendance WHERE employeeId = ? ORDER BY `date` DESC, employeeName ASC",
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
    id: `a${uuidv4().slice(0, 6)}`,
    employeeId: req.body.employeeId,
    employeeName: req.body.employeeName,
    date: req.body.date,
    status: req.body.status,
    checkIn: req.body.checkIn || "",
    checkOut: req.body.checkOut || "",
  };

  try {
    await query(
      `INSERT INTO attendance
        (id, employeeId, employeeName, \`date\`, status, checkIn, checkOut)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.employeeId,
        record.employeeName,
        record.date,
        record.status,
        record.checkIn,
        record.checkOut,
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
    const [result] = await query(
      `UPDATE attendance
       SET employeeId = ?, employeeName = ?, \`date\` = ?, status = ?, checkIn = ?, checkOut = ?
       WHERE id = ?`,
      [
        req.body.employeeId,
        req.body.employeeName,
        req.body.date,
        req.body.status,
        req.body.checkIn || "",
        req.body.checkOut || "",
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Record not found." });
    }

    const [rows] = await query("SELECT * FROM attendance WHERE id = ? LIMIT 1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [result] = await query("DELETE FROM attendance WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Record not found." });
    }

    return res.json({ message: "Attendance record deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
