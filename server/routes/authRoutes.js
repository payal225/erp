const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { pool, query } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const getAuthErrorMessage = (error, fallbackMessage) => {
  if (error?.code === "ER_ACCESS_DENIED_ERROR") {
    return "MySQL credentials were rejected. Restart the server to use the built-in demo data, or update DB_USER and DB_PASSWORD in server/.env.";
  }

  if (error?.code === "ECONNREFUSED") {
    return "MySQL is not running. Start MySQL and restart the server.";
  }

  if (error?.code === "ER_BAD_DB_ERROR") {
    return "Database not found. Create the mini_erp database and import server/data/mysql-schema.sql.";
  }

  return fallbackMessage;
};

const buildAuthPayload = (user) => {
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
    },
  };
};

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  try {
    const [rows] = await query(
      "SELECT id, name, email, password, role, employeeId FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password." });
    }

    return res.json(buildAuthPayload(user));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getAuthErrorMessage(error, "Server error.") });
  }
});

router.post("/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    const [existingRows] = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingRows[0]) {
      connection.release();
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const employeeId = `e${uuidv4().slice(0, 6)}`;
    const userId = `u${uuidv4().slice(0, 6)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const joiningDate = new Date().toISOString().split("T")[0];

    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO employees
        (id, name, email, phone, department, role, salary, joiningDate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, name, email, "", "General", "employee", 0, joiningDate, "Active"]
    );

    await connection.execute(
      `INSERT INTO users
        (id, name, email, password, role, employeeId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, "employee", employeeId]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json(
      buildAuthPayload({
        id: userId,
        name,
        email,
        role: "employee",
        employeeId,
      })
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
      connection.release();
    }
    console.error(error);
    return res
      .status(500)
      .json({ message: getAuthErrorMessage(error, "Unable to create account.") });
  }
});

module.exports = router;
