import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

export async function initDB() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  const schema = fs.readFileSync(
    path.resolve("src/db/schema.sql"),
    "utf-8"
  );

  await db.exec(schema);
  return db;
}
