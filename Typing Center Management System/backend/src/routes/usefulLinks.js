import express from "express";
import { getAll, getOne, execute } from "../db.js";

const router = express.Router();

/* =========================
   GET ALL USEFUL LINKS
========================= */
router.get("/", async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT * FROM useful_links ORDER BY category, created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch useful links error:", err);
    res.status(500).json({ error: "Failed to fetch useful links" });
  }
});

/* =========================
   CREATE USEFUL LINK
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, url, description, category, icon } = req.body;

    await execute(
      `INSERT INTO useful_links (name, url, description, category, icon) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, url, description, category, icon || null]
    );

    res.json({ success: true, message: "Link created successfully" });
  } catch (err) {
    console.error("❌ Create useful link error:", err);
    res.status(500).json({ error: "Failed to create useful link" });
  }
});

/* =========================
   UPDATE USEFUL LINK
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, category, icon } = req.body;

    await execute(
      `UPDATE useful_links 
       SET name = $1, url = $2, description = $3, category = $4, icon = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [name, url, description, category, icon || null, id]
    );

    res.json({ success: true, message: "Link updated successfully" });
  } catch (err) {
    console.error("❌ Update useful link error:", err);
    res.status(500).json({ error: "Failed to update useful link" });
  }
});

/* =========================
   DELETE USEFUL LINK
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await execute("DELETE FROM useful_links WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Link deleted successfully" });
  } catch (err) {
    console.error("❌ Delete useful link error:", err);
    res.status(500).json({ error: "Failed to delete useful link" });
  }
});

export default router;
