import express from "express";
import { getOne, getAll, execute } from "../db.js";
import { generateQuotationPDF } from "../utils/quotationPdf.js";

const router = express.Router();

/* =========================
   GET SINGLE QUOTATION
========================= */
router.get("/:id", async (req, res) => {
  try {
    const row = await getOne(
      `
      SELECT 
        q.*,
        i.invoice_number
      FROM quotations q
      LEFT JOIN invoices i ON q.invoice_id = i.id
      WHERE q.id = $1
      `,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    function formatApiDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
      } catch (err) {
        return dateString;
      }
    }

    const quotation = {
      ...row,
      items: row.items || [],
      date: formatApiDate(row.date),
      subtotal: Number(row.subtotal) || 0,
      vat_amount: Number(row.vat_amount) || 0,
      total: Number(row.total) || 0,
      client_id: row.client_id ? Number(row.client_id) : null,
      person_name: row.person_name || ''
    };

    res.json(quotation);
  } catch (err) {
    console.error("❌ Fetch quotation error:", err);
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
});

/* =========================
   DOWNLOAD QUOTATION PDF
========================= */
router.get("/:id/pdf", async (req, res) => {
  try {
    const quotation = await getOne(
      "SELECT * FROM quotations WHERE id = $1",
      [req.params.id]
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.items = quotation.items || [];
    
    // ✅ TEMPORARY FIX: Convert numbers for PDF
    quotation.subtotal = Number(quotation.subtotal) || 0;
    quotation.vat_amount = Number(quotation.vat_amount) || 0;
    quotation.total = Number(quotation.total) || 0;

    generateQuotationPDF(quotation, res);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

/* =========================
   GET ALL QUOTATIONS
========================= */
router.get("/", async (req, res) => {
  try {
    const rows = await getAll(`
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
        i.invoice_number,
        q.person_name  -- ✅ REMOVE THE "//" COMMENT, JUST KEEP THE FIELD
      FROM quotations q
      LEFT JOIN invoices i ON q.invoice_id = i.id
      ORDER BY q.created_at DESC
    `);

    // ✅ FIX: Convert PostgreSQL decimals to JavaScript numbers
    const quotations = rows.map(q => ({
      ...q,
      items: q.items || [],
      subtotal: Number(q.subtotal) || 0,
      vat_amount: Number(q.vat_amount) || 0,
      total: Number(q.total) || 0
    }));

    res.json(quotations);
  } catch (err) {
    console.error("❌ Fetch quotations error:", err);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

/* =========================
   CREATE QUOTATION
========================= */
router.post("/", async (req, res) => {
  try {
    console.log("📦 CREATE QUOTATION REQUEST RECEIVED");
    
    // Get next quotation number
    const row = await getOne("SELECT COUNT(*) as count FROM quotations");
    const quotation_number = `QT-${new Date().getFullYear()}-${String(parseInt(row?.count || 0) + 1).padStart(4, "0")}`;

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

    const formattedDate = new Date(date).toISOString().split('T')[0];

    // ✅ FIX: Stringify items for PostgreSQL
    // PostgreSQL pg driver needs JSON string, not JavaScript object
    let itemsToInsert = items || [];
const itemsJson = JSON.stringify(itemsToInsert);
console.log("🧹 Items to insert (stringified):", itemsJson);
    // Insert into database
    const result = await execute(
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
        itemsJson,
        subtotal,
        vat_amount,
        total,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        quotation_number,
        client_id || null,
        client_name,
        service_description || null,
        person_name || null,
        license_type || null,
        activity || null,
        service_category || null,
        formattedDate,
        itemsToInsert,  // ✅ Use STRINGIFIED JSON
        subtotal || 0,
        vat_amount || 0,
        total || 0,
        status || "draft",
        notes || ""
      ]
    );

    console.log("✅ Quotation created successfully:", quotation_number);
    res.json({ 
      success: true,
      id: result.rows[0]?.id, 
      quotation_number 
    });
    
  } catch (err) {
    console.error("❌ Create quotation error:", err.message);
    console.error("❌ Full error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to create quotation",
      details: err.message 
    });
  }
});

/* =========================
   UPDATE QUOTATION
========================= */
router.put("/:id", async (req, res) => {
  try {
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

    const formattedDate = new Date(date).toISOString().split('T')[0];

    // ✅ FIX: Stringify items
   const itemsToUpdate = JSON.stringify(items || []);

    await execute(
      `UPDATE quotations SET
        client_id = $1,
        client_name = $2,
        service_description = $3,
        person_name = $4,
        license_type = $5,
        activity = $6,
        service_category = $7,
        date = $8,
        items = $9,
        subtotal = $10,
        vat_amount = $11,
        total = $12,
        status = $13,
        notes = $14,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $15`,
      [
        client_id || null,
        client_name,
        service_description || null,
        person_name || null,
        license_type || null,
        activity || null,
        service_category || null,
        formattedDate,
        itemsToUpdate,  // ✅ Use STRINGIFIED JSON
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

/* =========================
   DELETE QUOTATION
========================= */
router.delete("/:id", async (req, res) => {
  try {
    // Check if quotation exists
    const quotation = await getOne(
      "SELECT * FROM quotations WHERE id = $1",
      [req.params.id]
    );
    
    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    // Check if quotation is already converted to invoice
    if (quotation.converted_to_invoice === true) {
      return res.status(400).json({ 
        error: "Cannot delete quotation that has been converted to invoice" 
      });
    }
    
    // Delete the quotation
    await execute("DELETE FROM quotations WHERE id = $1", [req.params.id]);
    
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
