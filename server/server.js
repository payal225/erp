require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { testConnection } = require("./db");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const taskRoutes = require("./routes/taskRoutes");
const payrollRoutes = require("./routes/payrollRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked for this origin."));
    },
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payroll", payrollRoutes);

app.get("/", (req, res) => res.json({ message: "Mini ERP API running" }));
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    await testConnection();
    console.log(`MySQL connected to ${process.env.DB_NAME || "mini_erp"}`);
  } catch (error) {
    console.error("MySQL connection check failed:", error.message);
  }
});
