import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getOne, execute } from "../db.js";

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "my-very-secure-typing-center-secret-2024";

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Username and password required" 
      });
    }

    // Check if IP is locked out
    const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
    
    if (attempts.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ 
        success: false, 
        message: `Too many login attempts. Try again in ${remainingMinutes} minutes.` 
      });
    }

    // Find user - using getOne helper
    const user = await getOne(
      "SELECT * FROM users WHERE username = $1 AND is_active = true",
      [username]
    );

    let isValidPassword = false;
    
    if (user) {
      // Verify password
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    }

    if (!user || !isValidPassword) {
      // Increment failed attempts
      attempts.count += 1;
      
      if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockUntil = Date.now() + LOCKOUT_TIME;
      }
      
      loginAttempts.set(ip, attempts);
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password",
        attemptsRemaining: MAX_ATTEMPTS - attempts.count
      });
    }

    // Reset attempts on successful login
    loginAttempts.delete(ip);

    // Update last login - using execute helper
    await execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        fullName: user.full_name 
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

/* =========================
   CHECK AUTH STATUS
========================= */
router.get("/check", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "No token provided" 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await getOne(
      "SELECT id, username, full_name, email, role, is_active FROM users WHERE id = $1 AND is_active = true",
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found or inactive" 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error("❌ Auth check error:", err);
    res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", (req, res) => {
  res.json({ 
    success: true, 
    message: "Logout successful" 
  });
});

export default router;
