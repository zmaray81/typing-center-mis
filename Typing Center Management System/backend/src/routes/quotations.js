import express from "express";
import { getDb } from "../db.js";
import { generateQuotationPDF } from "../utils/quotationPdf.js";

const router = express.Router();

/* =========================
   GET ALL QUOTATIONS
========================= */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
  SELECT 
    q.id,
    q.quotation_number,
    q.client_id,
    q.client_name,
    q.license_type,
    q.activity,
    q.service_category,
    q.date,
    q.items,
    q.subtotal,
    q.vat_amount,
    q.total,
    q.status,
    q.notes,
    q.converted_to_invoice,
    q.invoice_id,
    q.created_at,
    i.invoice_number
  FROM quotations q
  LEFT JOIN invoices i ON q.invoice_id = i.id
  ORDER BY q.created_at DESC
`);

    const quotations = rows.map(q => ({
      ...q,
      items: JSON.parse(q.items)
    }));

    res.json(quotations);
  } catch (err) {
    console.error("❌ Fetch quotations error:", err);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
  SELECT 
    q.*,
    i.invoice_number
  FROM quotations q
  LEFT JOIN invoices i ON q.invoice_id = i.id
  ORDER BY q.created_at DESC
`);

    const quotations = rows.map(q => ({
      ...q,
      items: JSON.parse(q.items)
    }));

    res.json(quotations);
  } catch (err) {
    console.error("❌ Fetch all quotations error:", err);
    res.status(500).json({ error: "Failed to fetch all quotations" });
  }
});

/* =========================
   GET SINGLE QUOTATION
========================= */
router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();

    const row = await db.get(
      `
      SELECT 
        q.*,
        i.invoice_number
      FROM quotations q
      LEFT JOIN invoices i ON q.invoice_id = i.id
      WHERE q.id = ?
      `,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    row.items = JSON.parse(row.items);
    res.json(row);
  } catch (err) {
    console.error("❌ Fetch quotation error:", err);
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
});

/* =========================
   CREATE QUOTATION
========================= */
router.post("/", async (req, res) => {
  try {
    const db = await getDb();

    const row = await db.get("SELECT COUNT(*) as count FROM quotations");
    const quotation_number = `QT-${new Date().getFullYear()}-${String(row.count + 1).padStart(4, "0")}`;

    const {
      client_id,
      client_name,
      service_description,
      person_name,
      license_type,
      activity,
      service_category,
      date,
      items,
      subtotal,
      vat_amount,
      total,
      status,
      notes
    } = req.body;

    const result = await db.run(
      `INSERT INTO quotations (
        quotation_number,
        client_id,
        client_name,
        service_description,
        person_name,
        license_type,
        activity,
        service_category,
        date,
        items,
        subtotal,
        vat_amount,
        total,
        status,
        notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        quotation_number,
        client_id || null,
        client_name,
        service_description || null,
        person_name || null,
        license_type || null,
        activity || null,
        service_category || null,
        date,
        JSON.stringify(items || []),
        subtotal || 0,
        vat_amount || 0,
        total || 0,
        status || "draft",
        notes || ""
      ]
    );

    res.json({ id: result.lastID, quotation_number });
  } catch (err) {
    console.error("❌ Create quotation error:", err);
    res.status(500).json({ error: "Failed to create quotation" });
  }
});

/* =========================
   UPDATE QUOTATION
========================= */
router.put("/:id", async (req, res) => {
  try {
    const db = await getDb();

    const {
      client_id,
      client_name,
      service_description,
      person_name,
      license_type,
      activity,
      service_category,
      date,
      items,
      subtotal,
      vat_amount,
      total,
      status,
      notes
    } = req.body;

    await db.run(
      `UPDATE quotations SET
        client_id = ?,
        client_name = ?,
        service_description = ?,
        person_name = ?,
        license_type = ?,
        activity = ?,
        service_category = ?,
        date = ?,
        items = ?,
        subtotal = ?,
        vat_amount = ?,
        total = ?,
        status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        client_id || null,
        client_name,
        service_description || null,
        person_name || null,
        license_type || null,
        activity || null,
        service_category || null,
        date,
        JSON.stringify(items || []),
        subtotal || 0,
        vat_amount || 0,
        total || 0,
        status || "draft",
        notes || "",
        req.params.id
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update quotation error:", err);
    res.status(500).json({ error: "Failed to update quotation" });
  }
});

// Download quotation PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const db = await getDb();

    const quotation = await db.get(
      "SELECT * FROM quotations WHERE id = ?",
      [req.params.id]
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.items = JSON.parse(quotation.items || "[]");

    generateQuotationPDF(quotation, res);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

/* =========================
   DELETE QUOTATION
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const db = await getDb();
    
    // Check if quotation exists
    const quotation = await db.get(
      "SELECT * FROM quotations WHERE id = ?",
      [req.params.id]
    );
    
    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    // Check if quotation is already converted to invoice
    if (quotation.converted_to_invoice === 1) {
      return res.status(400).json({ 
        error: "Cannot delete quotation that has been converted to invoice" 
      });
    }
    
    // Delete the quotation
    await db.run("DELETE FROM quotations WHERE id = ?", [req.params.id]);
    
    res.json({ 
      success: true, 
      message: "Quotation deleted successfully" 
    });
    
  } catch (err) {
    console.error("❌ Delete quotation error:", err);
    res.status(500).json({ error: "Failed to delete quotation" });
  }
});

export default router;
