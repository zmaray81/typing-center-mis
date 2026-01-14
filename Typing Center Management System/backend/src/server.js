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

const app = express();

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
