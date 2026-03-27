const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mini_erp_secret_key_2026";

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token." });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only." });
  next();
};

module.exports = { verifyToken, adminOnly, JWT_SECRET };
