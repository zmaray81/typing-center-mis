import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

const DB_PATH = "./database.sqlite";
const SCHEMA_PATH = path.resolve("src/db/schema.sql");

export async function getDb() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // Always enforce foreign keys
  await db.exec(`PRAGMA foreign_keys = ON;`);

  // Run schema.sql if tables don't exist
  const tables = await db.all(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='clients';
  `);

  if (tables.length === 0) {
    console.log("🛠️ Initializing database schema...");
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    await db.exec(schema);
    console.log("✅ Database schema created");
  }

  return db;
}
