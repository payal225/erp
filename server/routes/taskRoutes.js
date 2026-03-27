const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] =
      req.user.role === "admin"
        ? await query("SELECT * FROM tasks ORDER BY dueDate ASC, createdAt DESC")
        : await query(
            "SELECT * FROM tasks WHERE assignedTo = ? ORDER BY dueDate ASC, createdAt DESC",
            [req.user.employeeId]
          );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/", verifyToken, adminOnly, async (req, res) => {
  const task = {
    id: `t${uuidv4().slice(0, 6)}`,
    title: req.body.title,
    description: req.body.description,
    assignedTo: req.body.assignedTo,
    assignedName: req.body.assignedName,
    priority: req.body.priority || "Medium",
    status: req.body.status || "Pending",
    dueDate: req.body.dueDate,
    createdAt: new Date().toISOString().split("T")[0],
  };

  try {
    await query(
      `INSERT INTO tasks
        (id, title, description, assignedTo, assignedName, priority, status, dueDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.assignedTo,
        task.assignedName,
        task.priority,
        task.status,
        task.dueDate,
        task.createdAt,
      ]
    );

    return res.status(201).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === "employee") {
      [result] = await query("UPDATE tasks SET status = ? WHERE id = ?", [
        req.body.status,
        req.params.id,
      ]);
    } else {
      [result] = await query(
        `UPDATE tasks
         SET title = ?, description = ?, assignedTo = ?, assignedName = ?, priority = ?, status = ?, dueDate = ?
         WHERE id = ?`,
        [
          req.body.title,
          req.body.description,
          req.body.assignedTo,
          req.body.assignedName,
          req.body.priority,
          req.body.status,
          req.body.dueDate,
          req.params.id,
        ]
      );
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Task not found." });
    }

    const [rows] = await query("SELECT * FROM tasks WHERE id = ? LIMIT 1", [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const [result] = await query("DELETE FROM tasks WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.json({ message: "Task deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
