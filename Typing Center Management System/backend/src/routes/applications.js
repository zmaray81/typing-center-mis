import express from "express";
import { getOne, getAll, execute } from "../db.js";

const router = express.Router();

/* =========================
   GET ALL APPLICATIONS
========================= */
router.get("/", async (req, res) => {
  try {
    const rows = await getAll(
      "SELECT * FROM applications ORDER BY created_at DESC"
    );

    // PostgreSQL JSONB doesn't need parsing
    const parsed = rows.map(r => ({
      ...r,
      steps_completed: r.steps_completed || [],
      documents: r.documents || []
    }));

    res.json(parsed);
  } catch (err) {
    console.error("❌ Fetch applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/* =========================
   CREATE APPLICATION
========================= */
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received application data:", req.body);
    
    const {
      application_number,
      client_id,
      client_name,
      person_name,
      pre_approval_mb_number,
      invoice_id,
      application_type,
      application_type_description,
      emirate,
      current_step,
      steps_completed,
      status,
      start_date,
      expected_completion,
      completion_date,
      documents,
      notes
    } = req.body;

    // ✅ FIX: Convert empty/undefined client_id to null
    const processedClientId = 
      client_id === "" || client_id === undefined || client_id === null 
        ? null 
        : parseInt(client_id);

    console.log("🔍 Processed client_id:", processedClientId, "Type:", typeof processedClientId);

    const result = await execute(
      `INSERT INTO applications (
        application_number,
        client_id,
        client_name,
        person_name,
        pre_approval_mb_number,
        invoice_id,
        application_type,
        application_type_description,
        emirate,
        current_step,
        steps_completed,
        status,
        start_date,
        expected_completion,
        completion_date,
        documents,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        application_number,
        processedClientId,
        client_name,
        person_name,
        pre_approval_mb_number || null,
        invoice_id || null,
        application_type,
        application_type_description || null,
        emirate,
        current_step || null,
        steps_completed || [],
        status || 'in_progress',
        start_date || new Date().toISOString().split('T')[0],
        expected_completion || null,
        completion_date || null,
        documents || [],
        notes || null
      ]
    );

    console.log("✅ Application created successfully with ID:", result.rows[0]?.id);
    res.json({ 
      success: true, 
      id: result.rows[0]?.id,
      message: "Application created successfully" 
    });
  } catch (err) {
    console.error("❌ Create application error:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // More specific error messages for PostgreSQL
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        error: "Foreign key constraint failed",
        details: "The client_id does not exist in the clients table or is invalid",
        solution: "Either select an existing client or leave the client field empty"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create application",
      details: err.message 
    });
  }
});

/* =========================
   UPDATE APPLICATION
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Build dynamic SET clause
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
      if (key === 'steps_completed' || key === 'documents') {
        // JSON fields
        setClauses.push(`${key} = $${paramCount}`);
        values.push(data[key] || []);
      } else {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(data[key]);
      }
      paramCount++;
    });

    // Add ID as last parameter
    values.push(id);

    const query = `
      UPDATE applications 
      SET ${setClauses.join(", ")} 
      WHERE id = $${paramCount}
    `;

    await execute(query, values);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Update application error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

/* =========================
   DELETE APPLICATION
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await execute("DELETE FROM applications WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete application error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default router;