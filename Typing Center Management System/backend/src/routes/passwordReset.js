import express from "express";
import bcrypt from "bcrypt";
import { getDb } from "../db.js";
import crypto from "crypto";

const router = express.Router();

// In-memory store for reset tokens (in production, use Redis)
const resetTokens = new Map();

/* =========================
   REQUEST PASSWORD RESET
========================= */
router.post("/request", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const db = await getDb();
    
    // Find user by email
    const user = await db.get(
      "SELECT id, username, full_name, email FROM users WHERE email = ? AND is_active = 1",
      [email]
    );

    // For security, always return success even if email doesn't exist
    if (!user) {
      return res.json({ 
        success: true, 
        message: "If the email exists, a reset link will be sent" 
      });
    }

    // Generate reset token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 3600000; // 1 hour
    
    // Store token
    resetTokens.set(token, {
      userId: user.id,
      expiresAt
    });

    // In production, send email here
    console.log(`Password reset token for ${user.email}: ${token}`);
    console.log(`Reset link: http://localhost:5173/reset-password?token=${token}`);

    res.json({ 
      success: true, 
      message: "Password reset instructions sent to your email" 
    });

  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process reset request" 
    });
  }
});

/* =========================
   RESET PASSWORD WITH TOKEN
========================= */
router.post("/reset", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token and new password required" 
      });
    }

    // Validate token
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ 
        success: false, 
        message: "Reset token has expired" 
      });
    }

    const db = await getDb();
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newPasswordHash, tokenData.userId]
    );

    // Delete used token
    resetTokens.delete(token);

    res.json({ 
      success: true, 
      message: "Password has been reset successfully" 
    });

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password" 
    });
  }
});

export default router;