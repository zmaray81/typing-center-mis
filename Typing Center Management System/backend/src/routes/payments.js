import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

/* =========================
   GET PAYMENTS (OPTIONAL)
========================= */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT * FROM payments ORDER BY datetime(created_at) DESC`
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
    const db = await getDb();

    // ✅ EXPLICITLY READ EVERYTHING FROM BODY
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
    await db.run(
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
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
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
    const payments = await db.all(
      `SELECT amount FROM payments WHERE invoice_id = ?`,
      [invoice_id]
    );

    const amountPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const invoice = await db.get(
      `SELECT total FROM invoices WHERE id = ?`,
      [invoice_id]
    );

    const balance = Math.max(0, invoice.total - amountPaid);

    const paymentStatus =
      balance === 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    // 3️⃣ Update invoice
    await db.run(
      `UPDATE invoices SET
        amount_paid = ?,
        balance = ?,
        payment_status = ?
       WHERE id = ?`,
      [amountPaid, balance, paymentStatus, invoice_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Record payment error:", err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

export default router;
