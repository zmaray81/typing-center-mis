import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

/* LIST (exclude soft-deleted) */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT * FROM clients
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

/* CREATE */
router.post("/", async (req, res) => {
  try {
    const db = await getDb();
    const {
      client_type,
      company_name,
      contact_person,
      email,
      phone,
      trade_license_number
    } = req.body;

    // ✅ Check for duplicates BEFORE inserting
    let duplicateQuery = `
      SELECT id, company_name, contact_person, phone, email 
      FROM clients 
      WHERE deleted_at IS NULL AND (
    `;
    
    const params = [];
    const conditions = [];
    
    // Check by phone
    if (phone) {
      conditions.push("phone = ?");
      params.push(phone);
    }
    
    // Check by email if provided
    if (email) {
      conditions.push("email = ?");
      params.push(email);
    }
    
    // Check by company name for company clients
    if (client_type === 'company' && company_name) {
      conditions.push("(company_name = ? AND client_type = 'company')");
      params.push(company_name);
    }
    
    // Check by contact person for individual clients
    if (client_type === 'individual' && contact_person) {
      conditions.push("(contact_person = ? AND client_type = 'individual')");
      params.push(contact_person);
    }
    
    // Check by trade license
    if (trade_license_number) {
      conditions.push("trade_license_number = ?");
      params.push(trade_license_number);
    }
    
    if (conditions.length === 0) {
      return res.status(400).json({ error: "No unique identifier provided" });
    }
    
    duplicateQuery += conditions.join(" OR ") + ")";
    
    const existingClients = await db.all(duplicateQuery, params);
    
    if (existingClients.length > 0) {
      return res.status(409).json({ 
        error: "Client already exists",
        duplicates: existingClients 
      });
    }

    // Generate client code
    const clientCode = `CLI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    const result = await db.run(
      `INSERT INTO clients (
        client_code,
        client_type,
        company_name,
        contact_person,
        email,
        phone,
        trade_license_number,
        emirate,
        address,
        is_new_client,
        notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        clientCode,
        client_type,
        company_name,
        contact_person,
        email,
        phone,
        trade_license_number,
        req.body.emirate,
        req.body.address,
        req.body.is_new_client ? 1 : 0,
        req.body.notes
      ]
    );

    res.json({ 
      id: result.lastID,
      client_code: clientCode,
      message: "Client created successfully"
    });
  } catch (err) {
    console.error("Create client error:", err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

/* UPDATE */
router.put("/:id", async (req, res) => {
  try {
    console.log(`📝 Updating client ID: ${req.params.id}`);
    console.log('📥 Update data:', req.body);
    
    const db = await getDb();
    const { id } = req.params;

    const result = await db.run(
      `UPDATE clients SET
        company_name = ?,
        contact_person = ?,
        email = ?,
        phone = ?,
        trade_license_number = ?,
        emirate = ?,
        address = ?,
        notes = ?
      WHERE id = ? AND deleted_at IS NULL`,
      [
        req.body.company_name,
        req.body.contact_person,
        req.body.email,
        req.body.phone,
        req.body.trade_license_number,
        req.body.emirate,
        req.body.address,
        req.body.notes,
        id
      ]
    );

    console.log(`✅ Client ${id} updated, changes:`, result.changes);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: "Client not found or already deleted" 
      });
    }

    res.json({ 
      success: true,
      message: "Client updated successfully" 
    });
  } catch (err) {
    console.error("❌ Update client error:", err);
    res.status(500).json({ 
      error: "Failed to update client",
      details: err.message 
    });
  }
});

/* DELETE */
router.delete("/:id", async (req, res) => {
  try {
    console.log(`🗑️ Soft deleting client ID: ${req.params.id}`);
    
    const db = await getDb();
    const { id } = req.params;

    // First check if client exists
    const client = await db.get(
      "SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!client) {
      return res.status(404).json({ 
        error: "Client not found or already deleted" 
      });
    }

    // Perform soft delete
    const result = await db.run(
      `UPDATE clients SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    console.log(`✅ Client ${id} soft deleted, changes:`, result.changes);
    
    res.json({ 
      success: true,
      message: "Client deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete client error:", err);
    res.status(500).json({ 
      error: "Failed to delete client",
      details: err.message 
    });
  }
});

export default router;
