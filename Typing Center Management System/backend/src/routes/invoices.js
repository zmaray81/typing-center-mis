import express from "express";
import { getOne, getAll, execute } from "../db.js";
import { randomUUID } from "crypto";
import { generateInvoicePDF } from "../utils/invoicePdf.js";
import { logAudit, getClientIp, getAuditHistory } from "../utils/auditService.js";

const router = express.Router();

/* =========================
   GET ALL INVOICES
========================= */
router.get("/", async (req, res) => {
  try {
    const rows = await getAll(`
      SELECT i.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'amount', p.amount,
                   'method', p.method,
                   'date', p.payment_date,
                   'reference', p.reference
                 )
               ) FILTER (WHERE p.id IS NOT NULL), '[]'
             ) AS payments
      FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
      GROUP BY i.id
      ORDER BY i.created_date DESC
    `);

    // ✅ FIX: Convert all number fields for each invoice
    const invoices = rows.map(inv => {
      // Ensure items is an array
      const items = Array.isArray(inv.items) ? inv.items : [];
      
      // Ensure payments is an array
      const payments = Array.isArray(inv.payments) ? inv.payments : [];
      
      return {
        ...inv,
        items: items.map(item => ({
          ...item,
          amount: Number(item.amount) || 0,
          line_total: Number(item.line_total) || Number(item.amount) || 0
        })),
        payments: payments.map(payment => ({
          ...payment,
          amount: Number(payment.amount) || 0
        })),
        subtotal: Number(inv.subtotal) || 0,
        vat_amount: Number(inv.vat_amount) || 0,
        total: Number(inv.total) || 0,
        amount_paid: Number(inv.amount_paid) || 0,
        balance: Number(inv.balance) || 0,
        include_vat: Boolean(inv.include_vat)
      };
    });

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
    const invoice = await getOne(`
      SELECT i.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'amount', p.amount,
                   'method', p.method,
                   'date', p.payment_date,
                   'reference', p.reference
                 )
               ) FILTER (WHERE p.id IS NOT NULL), '[]'
             ) AS payments
      FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [req.params.id]);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // ✅ FIX: Convert all number fields
    invoice.items = invoice.items || [];
    invoice.payments = invoice.payments || [];
    
    // Convert string numbers to actual numbers
    invoice.subtotal = Number(invoice.subtotal) || 0;
    invoice.vat_amount = Number(invoice.vat_amount) || 0;
    invoice.total = Number(invoice.total) || 0;
    invoice.amount_paid = Number(invoice.amount_paid) || 0;
    invoice.balance = Number(invoice.balance) || 0;

    function formatApiDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
      } catch (err) {
        return dateString;
      }
    }
    invoice.date = formatApiDate(invoice.date);
    
    // Ensure items have proper numbers
    invoice.items = invoice.items.map(item => ({
      ...item,
      amount: Number(item.amount) || 0,
      line_total: Number(item.line_total) || Number(item.amount) || 0
    }));
    
    // Ensure payments have proper numbers
    invoice.payments = invoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount) || 0
    }));

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
    const id = randomUUID();

    // Generate sequential invoice number
    const last = await getOne(`
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

    await execute(
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        id,
        invoiceNumber,
        quotation_id || null,
        client_id || null,
        client_name,
        person_name || null,
        service_type || null,
        license_type || null,
        activity || null,
        date,
        items ? JSON.stringify(items) : '[]',
        subtotal || 0,
        include_vat ? true : false,
        vat_amount || 0,
        total,
        payment_status || "unpaid",
        amount_paid || 0,
        balance ?? total,
        payments ? JSON.stringify(payments) : '[]',
        notes || ""
      ]
    );

    // Log creation - you'll need to update auditService.js too
    await logAudit({
      tableName: "invoices",
      recordId: id,
      action: "created",
      req: req,
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
    // Get old data first
    const oldInvoice = await getOne(
      "SELECT * FROM invoices WHERE id = $1",
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
      changed_by = "system"
    } = req.body;

    await execute(
      `UPDATE invoices SET
        client_id = $1,
        client_name = $2,
        person_name = $3,
        service_type = $4,
        license_type = $5,
        activity = $6,
        date = $7,
        items = $8,
        subtotal = $9,
        include_vat = $10,
        vat_amount = $11,
        total = $12,
        payment_status = $13,
        amount_paid = $14,
        balance = $15,
        payments = $16,
        notes = $17
       WHERE id = $18`,
      [
        client_id || null,
        client_name,
        person_name || null,
        service_type || null,
        license_type || null,
        activity || null,
        date,
        items ? JSON.stringify(items) : '[]',
        subtotal || 0,
        include_vat ? true : false,
        vat_amount || 0,
        total,
        payment_status,
        amount_paid || 0,
        balance || 0,
        payments ? JSON.stringify(payments) : '[]',
        notes || "",
        req.params.id
      ]
    );

    // Get updated data
    const newInvoice = await getOne(
      "SELECT * FROM invoices WHERE id = $1",
      [req.params.id]
    );

    // Log the update
    await logAudit({
      tableName: "invoices",
      recordId: req.params.id,
      action: "updated",
      req: req,
      oldData: {
        client_name: oldInvoice.client_name,
        person_name: oldInvoice.person_name,
        total: oldInvoice.total,
        payment_status: oldInvoice.payment_status,
        amount_paid: oldInvoice.amount_paid,
        balance: oldInvoice.balance,
        items: oldInvoice.items || [],
        notes: oldInvoice.notes
      },
      newData: {
        client_name: client_name,
        person_name: person_name || null,
        total: total,
        payment_status: payment_status,
        amount_paid: amount_paid || 0,
        balance: balance || 0,
        items: items || [],
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
    // Get invoice before deleting
    const invoice = await getOne(
      "SELECT * FROM invoices WHERE id = $1",
      [req.params.id]
    );

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Delete related payments first (if any)
    await execute("DELETE FROM payments WHERE invoice_id = $1", [req.params.id]);
    
    // Then delete the invoice
    await execute("DELETE FROM invoices WHERE id = $1", [req.params.id]);

    await logAudit({
      tableName: "invoices",
      recordId: req.params.id,
      action: "deleted",
      req: req,
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
========================= */
router.post("/from-quotation/:quotationId", async (req, res) => {
  try {
    const quotationId = req.params.quotationId;

    const quotation = await getOne(
      "SELECT * FROM quotations WHERE id = $1",
      [quotationId]
    );

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    if (quotation.converted_to_invoice === true) {
      return res.status(400).json({
        error: "Quotation already converted to invoice"
      });
    }

    // ✅ FIX: Ensure items is properly formatted JSON
    let itemsToInsert = [];
    
    if (quotation.items) {
      if (typeof quotation.items === 'string') {
        // If it's a JSON string, parse it to ensure it's valid
        try {
          itemsToInsert = JSON.parse(quotation.items);
        } catch (err) {
          console.error("Failed to parse items string:", err);
          itemsToInsert = [];
        }
      } else if (Array.isArray(quotation.items)) {
        // If it's already an array, use it directly
        itemsToInsert = quotation.items;
      }
    }

    // ✅ FIX: Stringify the items array for PostgreSQL JSONB
    // PostgreSQL requires JSON string for JSONB columns
    const itemsJson = JSON.stringify(itemsToInsert);

    // Generate sequential invoice number
    const last = await getOne(`
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

    // ✅ DEBUG: Log the values before inserting
    console.log("🔄 Converting quotation to invoice:");
    console.log("Invoice ID:", id);
    console.log("Invoice Number:", invoiceNumber);
    console.log("Quotation ID:", quotation.id);
    console.log("Items (stringified):", itemsJson);
    console.log("Items type:", typeof itemsJson);
    console.log("Subtotal:", Number(quotation.subtotal) || 0);
    console.log("Total:", Number(quotation.total) || 0);

     const formattedDate = new Date(quotation.date).toISOString().split('T')[0];
    console.log("Original date:", quotation.date, "Formatted date:", formattedDate);

    await execute(
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
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
        itemsJson,  // ✅ Use STRINGIFIED JSON for PostgreSQL
        Number(quotation.subtotal) || 0,
        Number(quotation.vat_amount) || 0,
        Number(quotation.total) || 0,
        "unpaid",
        0,
        Number(quotation.total) || 0,
        '[]',  // ✅ Empty JSON array as string
        quotation.notes || ""
      ]
    );

    // Mark quotation as converted + store invoice number
    await execute(
      `UPDATE quotations
       SET converted_to_invoice = true,
           invoice_id = $1
       WHERE id = $2`,
      [id, quotationId]
    );

    await logAudit({
      tableName: "invoices",
      recordId: id,
      action: "created_from_quotation",
      req: req,
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
      req: req,
      oldData: {
        converted_to_invoice: false,
        invoice_id: null
      },
      newData: {
        converted_to_invoice: true,
        invoice_id: id
      }
    });

    res.json({ id, invoice_number: invoiceNumber });
  } catch (err) {
    console.error("❌ Convert quotation to invoice error:", err.message);
    console.error("❌ Full error:", err);
    res.status(500).json({ 
      error: "Failed to convert quotation to invoice",
      details: err.message 
    });
  }
});

/* =========================
   DOWNLOAD INVOICE PDF
========================= */
router.get("/:id/pdf", async (req, res) => {
  try {
    const invoice = await getOne(`
      SELECT i.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'amount', p.amount,
                   'method', p.method,
                   'date', p.payment_date,
                   'reference', p.reference
                 )
               ) FILTER (WHERE p.id IS NOT NULL), '[]'
             ) AS payments
      FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [req.params.id]);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // ✅ FIX: Ensure all number fields are actually numbers
    invoice.items = invoice.items || [];
    invoice.payments = invoice.payments || [];
    
    // Convert string numbers to actual numbers for PDF
    invoice.subtotal = Number(invoice.subtotal) || 0;
    invoice.vat_amount = Number(invoice.vat_amount) || 0;
    invoice.total = Number(invoice.total) || 0;
    invoice.amount_paid = Number(invoice.amount_paid) || 0;
    invoice.balance = Number(invoice.balance) || 0;
    
    // Also ensure items have proper numbers
    invoice.items = invoice.items.map(item => ({
      ...item,
      amount: Number(item.amount) || 0,
      line_total: Number(item.line_total) || Number(item.amount) || 0
    }));
    
    // Also ensure payments have proper numbers
    invoice.payments = invoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount) || 0
    }));

    invoice.include_vat = Boolean(invoice.include_vat);

    generateInvoicePDF(invoice, res);
  } catch (err) {
    console.error("PDF error:", err.message);
    console.error("Full error:", err);
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
