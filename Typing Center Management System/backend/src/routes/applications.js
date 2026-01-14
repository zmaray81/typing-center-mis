import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

/* =========================
   GET ALL APPLICATIONS
========================= */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM applications ORDER BY created_at DESC"
    );

    const parsed = rows.map(r => ({
      ...r,
      steps_completed: JSON.parse(r.steps_completed || "[]"),
      documents: JSON.parse(r.documents || "[]")
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
    
    const db = await getDb();
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

    const result = await db.run(
      `INSERT INTO applications (
        application_number,
        client_id,
        client_name,
        person_name,
        pre_approval_mb_number,
        invoice_id,
        application_type,
        emirate,
        current_step,
        steps_completed,
        status,
        start_date,
        expected_completion,
        completion_date,
        documents,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        application_number,
        processedClientId,  // ✅ Use processed client_id
        client_name,
        person_name,
        pre_approval_mb_number || null,
        invoice_id || null,
        application_type,
        emirate,
        current_step || null,
        JSON.stringify(steps_completed || []),
        status || 'in_progress',
        start_date || new Date().toISOString().split('T')[0],
        expected_completion || null,
        completion_date || null,
        JSON.stringify(documents || []),
        notes || null
      ]
    );

    console.log("✅ Application created successfully with ID:", result.lastID);
    res.json({ 
      success: true, 
      id: result.lastID,
      message: "Application created successfully" 
    });
  } catch (err) {
    console.error("❌ Create application error:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // More specific error messages
    if (err.code === 'SQLITE_CONSTRAINT') {
      if (err.message.includes('FOREIGN KEY')) {
        return res.status(400).json({ 
          error: "Foreign key constraint failed",
          details: "The client_id does not exist in the clients table or is invalid",
          solution: "Either select an existing client or leave the client field empty"
        });
      }
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
    const db = await getDb();
    const { id } = req.params;

    const data = {
      ...req.body,
      steps_completed: JSON.stringify(req.body.steps_completed || []),
      documents: JSON.stringify(req.body.documents || [])
    };

    if (req.body.application_type_description !== undefined) {
      data.application_type_description = req.body.application_type_description;
    }

    const fields = Object.keys(data)
      .map(k => `${k} = ?`)
      .join(", ");

    const values = Object.values(data);

    await db.run(
      `UPDATE applications SET ${fields} WHERE id = ?`,
      [...values, id]
    );

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
    const db = await getDb();
    await db.run("DELETE FROM applications WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete application error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default router;
