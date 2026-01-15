import express from "express";
import { getAll, execute } from "../db.js";

const router = express.Router();

/* =========================
   GET PAYMENTS
========================= */
router.get("/", async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT * FROM payments ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch payments error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

/* =========================
   RECORD PAYMENT
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      invoice_id,
      invoice_number,
      client_id,
      client_name,
      payment_date,
      amount,
      method,
      reference,
      notes
    } = req.body;

    if (!invoice_id || !invoice_number || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Insert payment
    await execute(
      `INSERT INTO payments (
        invoice_id,
        invoice_number,
        client_id,
        client_name,
        payment_date,
        amount,
        method,
        reference,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        invoice_id,
        invoice_number,
        client_id || null,
        client_name,
        payment_date,
        amount,
        method,
        reference || "",
        notes || ""
      ]
    );

    // 2️⃣ Recalculate invoice totals
    const payments = await getAll(
      `SELECT amount FROM payments WHERE invoice_id = $1`,
      [invoice_id]
    );

    const amountPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const invoice = await execute(
      `SELECT total FROM invoices WHERE id = $1`,
      [invoice_id]
    );

    const balance = Math.max(0, invoice.rows[0]?.total - amountPaid);

    const paymentStatus =
      balance === 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    // 3️⃣ Update invoice
    await execute(
      `UPDATE invoices SET
        amount_paid = $1,
        balance = $2,
        payment_status = $3
       WHERE id = $4`,
      [amountPaid, balance, paymentStatus, invoice_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Record payment error:", err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

export default router;