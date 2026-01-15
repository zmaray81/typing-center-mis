import express from "express";
import cors from "cors";
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import quotationsRoutes from "./routes/quotations.js";
import invoicesRouter from "./routes/invoices.js";
import paymentsRoutes from "./routes/payments.js";
import applicationsRoutes from "./routes/applications.js";
import clientsRoutes from "./routes/clients.js";
import passwordResetRouter from './routes/passwordReset.js';

// ADD THESE 3 LINES:
import dotenv from 'dotenv';
dotenv.config();
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const app = express();

// ADD THIS FUNCTION RIGHT HERE (before app.use):
const createDefaultAdmin = () => {
  const db = new sqlite3.Database('./database.sqlite');
  
  // Check if admin exists
  db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
    if (err) {
      console.error('Error checking admin:', err);
      db.close();
      return;
    }
    
    if (!row) {
      console.log('No admin found. Creating default admin...');
      
      // Create admin with password: admin123
      bcrypt.hash('admin123', 10, (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err);
          db.close();
          return;
        }
        
        db.run(
          `INSERT INTO users (username, password_hash, full_name, email, role, is_active) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['admin', hash, 'System Administrator', 'admin@typingcenter.com', 'admin', 1],
          function(err) {
            if (err) {
              console.error('Error creating admin:', err);
            } else {
              console.log('✅ Default admin created!');
              console.log('Username: admin');
              console.log('Password: admin123');
            }
            db.close();
          }
        );
      });
    } else {
      console.log('Admin user already exists');
      db.close();
    }
  });
};

// CALL THE FUNCTION HERE:
createDefaultAdmin();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
// Public routes (no authentication required)
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/password-reset', passwordResetRouter);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/invoices", invoicesRouter);
app.use("/api/payments", paymentsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use('/api/clients', clientsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Typing Center MIS Backend Running");
});
