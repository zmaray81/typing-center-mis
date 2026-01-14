import { getDb } from "./db.js";

async function seed() {
  try {
    const db = await getDb();

    console.log("🌱 Seeding database...");

    await db.run(`
      INSERT INTO clients (
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
      ) VALUES (
        'CLI-2025-0001',
        'company',
        'Demo Client LLC',
        'Demo Contact',
        'demo@client.com',
        '0500000000',
        'TL-123456',
        'dubai',
        'Dubai, UAE',
        1,
        'Seeded demo client'
      )
    `);

    console.log("✅ Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
