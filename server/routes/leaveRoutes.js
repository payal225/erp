const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

const resolveEmployee = async (req) => {
  const [rows] = req.user.employeeId
    ? await query("SELECT id, name, email FROM employees WHERE id = ? LIMIT 1", [req.user.employeeId])
    : await query("SELECT id, name, email FROM employees WHERE email = ? LIMIT 1", [req.user.email]);

  return rows[0] || null;
};

router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const [rows] = await query(
        "SELECT * FROM leave_requests ORDER BY createdAt DESC, startDate DESC"
      );
      return res.json(rows);
    }

    const employee = await resolveEmployee(req);

    if (!employee) {
      return res.json([]);
    }

    const [rows] = await query(
      "SELECT * FROM leave_requests WHERE employeeId = ? ORDER BY createdAt DESC, startDate DESC",
      [employee.id]
    );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const employee = await resolveEmployee(req);

    if (!employee) {
      return res.status(400).json({ message: "Employee record not found." });
    }

    if (!req.body.leaveType || !req.body.startDate || !req.body.endDate || !req.body.reason) {
      return res
        .status(400)
        .json({ message: "Leave type, dates, and reason are required." });
    }

    if (req.body.endDate < req.body.startDate) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const request = {
      id: `l${uuidv4().slice(0, 6)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType: req.body.leaveType,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
      status: "Pending",
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await query(
      `INSERT INTO leave_requests
        (id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, reviewNote, reviewedBy, reviewedAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.id,
        request.employeeId,
        request.employeeName,
        request.leaveType,
        request.startDate,
        request.endDate,
        request.reason,
        request.status,
        request.reviewNote,
        request.reviewedBy,
        request.reviewedAt,
        request.createdAt,
      ]
    );

    return res.status(201).json(request);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to save leave request." });
  }
});

router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  const status = req.body.status;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid review status." });
  }

  try {
    const [result] = await query(
      `UPDATE leave_requests
       SET status = ?, reviewNote = ?, reviewedBy = ?, reviewedAt = ?
       WHERE id = ?`,
      [
        status,
        req.body.reviewNote || null,
        req.user.name,
        new Date().toISOString().split("T")[0],
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    const [rows] = await query("SELECT * FROM leave_requests WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to review leave request." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM leave_requests WHERE id = ? LIMIT 1", [
      req.params.id,
    ]);
    const request = rows[0];

    if (!request) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (req.user.role !== "admin") {
      const employee = await resolveEmployee(req);

      if (!employee || request.employeeId !== employee.id) {
        return res.status(403).json({ message: "Not allowed." });
      }

      if (request.status !== "Pending") {
        return res.status(403).json({ message: "Only pending requests can be withdrawn." });
      }
    }

    await query("DELETE FROM leave_requests WHERE id = ?", [req.params.id]);
    return res.json({ message: "Leave request removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to remove leave request." });
  }
});

module.exports = router;
