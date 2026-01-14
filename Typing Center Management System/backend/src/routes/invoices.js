import express from "express";
import { getDb } from "../db.js";
import { randomUUID } from "crypto";
import { generateInvoicePDF } from "../utils/invoicePdf.js";
import { logAudit, getClientIp, getAuditHistory } from "../utils/auditService.js";

const router = express.Router();

/* =========================
   GET ALL INVOICES
========================= */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();

    const rows = await db.all(`
  SELECT i.*,
         COALESCE(
           json_group_array(
             json_object(
               'amount', p.amount,
               'method', p.method,
               'date', p.payment_date,
               'reference', p.reference
             )
           ), '[]'
         ) AS payments
  FROM invoices i
  LEFT JOIN payments p ON p.invoice_id = i.id
  GROUP BY i.id
  ORDER BY datetime(i.created_date) DESC
`);

    const invoices = rows.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || "[]"),
      payments: JSON.parse(inv.payments),
      include_vat: Boolean(inv.include_vat)
    }));

    res.json(invoices);
  } catch (err) {
    console.error("❌ Fetch invoices error:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/* =========================
   GET SINGLE INVOICE
========================= */
router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();

    const invoice = await db.get(`
  SELECT i.*,
         COALESCE(
           json_group_array(
             json_object(
               'amount', p.amount,
               'method', p.method,
               'date', p.payment_date,
               'reference', p.reference
             )
           ), '[]'
         ) AS payments
  FROM invoices i
  LEFT JOIN payments p ON p.invoice_id = i.id
  WHERE i.id = ?
  GROUP BY i.id
`, [req.params.id]);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    invoice.items = JSON.parse(invoice.items || "[]");
    invoice.payments = JSON.parse(invoice.payments);
    invoice.include_vat = Boolean(invoice.include_vat);

    res.json(invoice);
  } catch (err) {
    console.error("❌ Fetch invoice error:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

/* =========================
   CREATE INVOICE (MANUAL)
========================= */
router.post("/", async (req, res) => {
  try {
    const db = await getDb();
    const id = randomUUID();

    // Generate sequential invoice number
const last = await db.get(`
  SELECT invoice_number
  FROM invoices
  ORDER BY created_date DESC
  LIMIT 1
`);

const year = new Date().getFullYear();
let seq = 1;

if (last?.invoice_number) {
  const match = last.invoice_number.match(/INV-(\d{4})-(\d+)/);
  if (match && Number(match[1]) === year) {
    seq = Number(match[2]) + 1;
  }
}

const invoiceNumber = `INV-${year}-${String(seq).padStart(5, "0")}`;

    const {
      quotation_id,
      client_id,
      client_name,
      person_name,
      service_type,
      license_type,
      activity,
      date,
      items,
      subtotal,
      include_vat,
      vat_amount,
      total,
      payment_status,
      amount_paid,
      balance,
      payments,
      notes
    } = req.body;

    await db.run(
  `INSERT INTO invoices (
    id,
    invoice_number,
    quotation_id,
    client_id,
    client_name,
    person_name,
    service_type,
    license_type,
    activity,
    date,
    items,
    subtotal,
    include_vat,
    vat_amount,
    total,
    payment_status,
    amount_paid,
    balance,
    payments,
    notes
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
    id,
    invoiceNumber, // ✅ CORRECT
    quotation_id || null,
    client_id || null,
    client_name,
    person_name || null,
    service_type || null,
    license_type || null,
    activity || null,
    date,
    JSON.stringify(items || []),
    subtotal || 0,
    include_vat ? 1 : 0,
    vat_amount || 0,
    total,
    payment_status || "unpaid",
    amount_paid || 0,
    balance ?? total,
    JSON.stringify(payments || []),
    notes || ""
  ]
);

 // Log creation
     await logAudit({
      tableName: "invoices",
      recordId: id,
      action: "created",
      req: req, // Pass request object to get user info
      newData: {
        invoice_number: invoiceNumber,
        client_name: client_name,
        person_name: person_name || null,
        total: total,
        payment_status: payment_status || "unpaid",
        items: items || []
      }
    });

    res.json({ id });
  } catch (err) {
    console.error("❌ Create invoice error:", err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

/* =========================
   UPDATE INVOICE
========================= */
router.put("/:id", async (req, res) => {
  try {
    const db = await getDb();

    // Get old data first
    const oldInvoice = await db.get(
      "SELECT * FROM invoices WHERE id = ?",
      [req.params.id]
    );

    if (!oldInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const {
      client_id,
      client_name,
      person_name,
      service_type,
      license_type,
      activity,
      date,
      items,
      subtotal,
      include_vat,
      vat_amount,
      total,
      payment_status,
      amount_paid,
      balance,
      payments,
      notes,
      changed_by = "system"  // Optional: who made the change
    } = req.body;

    await db.run(
      `UPDATE invoices SET
        client_id = ?,
        client_name = ?,
        person_name = ?,
        service_type = ?,
        license_type = ?,
        activity = ?,
        date = ?,
        items = ?,
        subtotal = ?,
        include_vat = ?,
        vat_amount = ?,
        total = ?,
        payment_status = ?,
        amount_paid = ?,
        balance = ?,
        payments = ?,
        notes = ?
       WHERE id = ?`,
      [
        client_id || null,
        client_name,
        person_name || null,
        service_type || null,
        license_type || null,
        activity || null,
        date,
        JSON.stringify(items || []),
        subtotal || 0,
        include_vat ? 1 : 0,
        vat_amount || 0,
        total,
        payment_status,
        amount_paid || 0,
        balance || 0,
        JSON.stringify(payments || []),
        notes || "",
        req.params.id
      ]
    );

   // Get updated data
    const newInvoice = await db.get(
      "SELECT * FROM invoices WHERE id = ?",
      [req.params.id]
    );

    // Log the update
    await logAudit({
      tableName: "invoices",
      recordId: req.params.id,
      action: "updated",
      req: req, // Pass request object to get user info
      oldData: {
        client_name: oldInvoice.client_name,
        person_name: oldInvoice.person_name,
        total: oldInvoice.total,
        payment_status: oldInvoice.payment_status,
        amount_paid: oldInvoice.amount_paid,
        balance: oldInvoice.balance,
        items: JSON.parse(oldInvoice.items || "[]"),
        notes: oldInvoice.notes
      },
      newData: {
        client_name: client_name,
        person_name: person_name || null,
        total: total,
        payment_status: payment_status,
        amount_paid: amount_paid || 0,
        balance: balance || 0,
        items: items,
        notes: notes || ""
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update invoice error:", err);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

/* =========================
   DELETE INVOICE
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const db = await getDb();
    
    // Get invoice before deleting
    const invoice = await db.get(
      "SELECT * FROM invoices WHERE id = ?",
      [req.params.id]
    );

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Delete related payments first (if any)
    await db.run("DELETE FROM payments WHERE invoice_id = ?", [req.params.id]);
    
    // Then delete the invoice
    await db.run("DELETE FROM invoices WHERE id = ?", [req.params.id]);

    // ✅ FIXED: Log deletion with user tracking
    await logAudit({
      tableName: "invoices",
      recordId: req.params.id,
      action: "deleted",
      req: req, // Pass request object to get user info
      oldData: {
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        total: invoice.total,
        payment_status: invoice.payment_status
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete invoice error:", err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

/* =========================
   CREATE INVOICE FROM QUOTATION
   (OPTIONAL FLOW)
========================= */
router.post("/from-quotation/:quotationId", async (req, res) => {
  try {
    
    const db = await getDb();
    const quotationId = req.params.quotationId;

    const quotation = await db.get(
      "SELECT * FROM quotations WHERE id = ?",
      [quotationId]
    );

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    if (quotation.converted_to_invoice === 1) {
  return res.status(400).json({
    error: "Quotation already converted to invoice"
  });
}

    // ✅ Generate sequential invoice number (same logic as manual)
    const last = await db.get(`
      SELECT invoice_number
      FROM invoices
      ORDER BY created_date DESC
      LIMIT 1
    `);

    const year = new Date().getFullYear();
    let seq = 1;

    if (last?.invoice_number) {
      const match = last.invoice_number.match(/INV-(\d{4})-(\d+)/);
      if (match && Number(match[1]) === year) {
        seq = Number(match[2]) + 1;
      }
    }

    const invoiceNumber = `INV-${year}-${String(seq).padStart(5, "0")}`;
    const id = randomUUID();

    await db.run(
  `INSERT INTO invoices (
    id,
    invoice_number,
    quotation_id,
    client_id,
    client_name,
    person_name,
    service_type,
    license_type,
    activity,
    date,
    items,
    subtotal,
    vat_amount,
    total,
    payment_status,
    amount_paid,
    balance,
    payments,
    notes
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
    id,
    invoiceNumber,
    quotation.id,
    quotation.client_id || null,
    quotation.client_name,
    quotation.person_name || null,
    quotation.service_category,
    quotation.license_type,
    quotation.activity,
    quotation.date,
    quotation.items,
    quotation.subtotal || 0,
    quotation.vat_amount || 0,
    quotation.total,
    "unpaid",
    0,
    quotation.total,
    JSON.stringify([]),
    quotation.notes || ""
  ]
);

    // Mark quotation as converted + store invoice number
await db.run(
  `UPDATE quotations
   SET converted_to_invoice = 1,
       invoice_id = ?
   WHERE id = ?`,
  [id, quotationId]
);

  // ✅ FIXED: Log conversion with user tracking
    await logAudit({
      tableName: "invoices",
      recordId: id,
      action: "created_from_quotation",
      req: req, // Pass request object to get user info
      newData: {
        invoice_number: invoiceNumber,
        client_name: quotation.client_name,
        total: quotation.total,
        from_quotation: quotationId,
        quotation_number: quotation.quotation_number
      }
    });

    await logAudit({
      tableName: "quotations",
      recordId: quotationId,
      action: "converted_to_invoice",
      req: req, // Pass request object to get user info
      oldData: {
        converted_to_invoice: 0,
        invoice_id: null
      },
      newData: {
        converted_to_invoice: 1,
        invoice_id: id
      }
    });

    res.json({ id, invoice_number: invoiceNumber });
  } catch (err) {
    console.error("❌ Convert quotation to invoice error:", err);
    res.status(500).json({ error: "Failed to convert quotation to invoice" });
  }
});

/* =========================
   DOWNLOAD INVOICE PDF
========================= */
router.get("/:id/pdf", async (req, res) => {
  try {
    const db = await getDb();

    const invoice = await db.get(
      `SELECT i.*,
         COALESCE(
           json_group_array(
             json_object(
               'amount', p.amount,
               'method', p.method,
               'date', p.payment_date,
               'reference', p.reference
             )
           ), '[]'
         ) AS payments
      FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE i.id = ?
      GROUP BY i.id`,
      [req.params.id]
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.items = JSON.parse(invoice.items || "[]");
    invoice.payments = JSON.parse(invoice.payments);
    invoice.include_vat = Boolean(invoice.include_vat);

    generateInvoicePDF(invoice, res);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

/* =========================
   GET AUDIT HISTORY FOR INVOICE
========================= */
router.get("/:id/audit", async (req, res) => {
  try {
    const history = await getAuditHistory("invoices", req.params.id);
    res.json(history);
  } catch (err) {
    console.error("❌ Get audit history error:", err);
    res.status(500).json({ error: "Failed to fetch audit history" });
  }
});

export default router;
