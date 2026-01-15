import express from "express";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { getOne, getAll, execute } from "../db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "my-very-secure-typing-center-secret-2024";

// Middleware to verify JWT and check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    res.status(401).json({ error: "Authentication failed" });
  }
};

/* =========================
   GET ALL USERS (Admin only)
========================= */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const users = await getAll(
      `SELECT 
        id, 
        username, 
        full_name, 
        email, 
        phone, 
        role, 
        is_active, 
        created_at, 
        last_login 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* =========================
   CREATE USER (Admin only)
========================= */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { username, password, full_name, email, phone, role } = req.body;
    
    if (!username || !password || !full_name) {
      return res.status(400).json({ error: "Username, password, and full name are required" });
    }

    // Check if username already exists
    const existingUser = await getOne(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await execute(
      `INSERT INTO users (
        username, password_hash, full_name, email, phone, role
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, password_hash, full_name, email || null, phone || null, role || "user"]
    );

    res.json({ 
      success: true, 
      id: result.rows[0]?.id,
      message: "User created successfully" 
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

/* =========================
   UPDATE USER (Admin only)
========================= */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role, is_active } = req.body;

    await execute(
      `UPDATE users SET
        full_name = $1,
        email = $2,
        phone = $3,
        role = $4,
        is_active = $5
      WHERE id = $6`,
      [full_name, email || null, phone || null, role, is_active ? true : false, id]
    );

    res.json({ 
      success: true, 
      message: "User updated successfully" 
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/* =========================
   DELETE USER (Admin only)
========================= */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: "Cannot delete your own account" 
      });
    }

    // Check if user exists
    const user = await getOne(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    // Delete the user
    await execute("DELETE FROM users WHERE id = $1", [id]);

    res.json({ 
      success: true, 
      message: "User deleted successfully" 
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ 
      error: "Failed to delete user",
      details: err.message 
    });
  }
});

/* =========================
   CHANGE PASSWORD
========================= */
router.put("/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Current and new password required" 
      });
    }

    // Get current password hash
    const user = await getOne(
      "SELECT password_hash FROM users WHERE id = $1",
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await execute(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, id]
    );

    res.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ 
      error: "Failed to change password",
      details: err.message 
    });
  }
});

export default router;