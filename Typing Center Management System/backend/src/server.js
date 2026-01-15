import 'dotenv/config';
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
import { initializeDatabase } from './db.js';

const app = express();

// Initialize database before starting server
initializeDatabase().then(() => {
  console.log('✅ Database initialized');
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

const allowedOrigins = [
  'http://localhost:5173',  // Local development
  'http://127.0.0.1:5173',  // Alternative localhost
  'http://localhost:4173',  // Vite preview
  'https://typing-center-frontend.onrender.com'  // Your production frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  res.send("Typing Center MIS Backend Running with PostgreSQL");
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const { getDb } = await import('./db.js');
    const db = getDb();
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});