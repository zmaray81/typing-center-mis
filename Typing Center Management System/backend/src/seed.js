import { getDb, execute } from "./db.js";

async function seed() {
  try {
    console.log("🌱 Seeding PostgreSQL database...");

    // Initialize database connection
    getDb();

    // Check if demo client already exists
    const existingClient = await execute(
      "SELECT id FROM clients WHERE client_code = $1",
      ['CLI-2025-0001']
    );

    if (existingClient.rows.length > 0) {
      console.log("✅ Demo client already exists, skipping seed");
      process.exit(0);
    }

    // Insert demo client
    const result = await execute(
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        'CLI-2025-0001',
        'company',
        'Demo Client LLC',
        'Demo Contact',
        'demo@client.com',
        '0500000000',
        'TL-123456',
        'dubai',
        'Dubai, UAE',
        true, // PostgreSQL boolean
        'Seeded demo client'
      ]
    );

    console.log("✅ Seeding completed successfully");
    console.log(`📋 Created demo client with ID: ${result.rows[0]?.id}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

// Run only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export default seed;