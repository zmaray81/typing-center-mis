import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.resolve("src/db/schema-postgres.sql");

// Create a connection pool
let pool;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('🔗 Connecting to PostgreSQL database...');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test the connection
    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

// Helper function to check and initialize tables
export async function initializeDatabase() {
  try {
    const db = getDb();
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    
    // Check if users table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const result = await db.query(checkQuery);
    const tableExists = result.rows[0].exists;
    
    if (!tableExists) {
      console.log("🛠️ Initializing database schema...");
      // Split schema by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement);
          } catch (err) {
            console.warn(`Warning executing statement: ${err.message}`);
          }
        }
      }
      console.log("✅ Database schema created");
      
      // Create initial admin user if doesn't exist
      await createInitialAdmin();
    } else {
      console.log("✅ Database already initialized");
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

async function createInitialAdmin() {
  try {
    const db = getDb();
    const bcrypt = await import('bcrypt');
    
    // Check if any admin exists
    const adminCheck = await db.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    
    if (adminCheck.rows.length === 0) {
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await db.query(`
        INSERT INTO users (username, password_hash, full_name, email, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', hashedPassword, 'Administrator', 'admin@example.com', 'admin', true]);
      
      console.log("✅ Default admin user created (username: admin, password: admin123)");
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Helper function for queries
export async function query(text, params) {
  const db = getDb();
  try {
    const start = Date.now();
    const result = await db.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query: ${text}`, { duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Database query error:', {
      error: error.message,
      query: text,
      params
    });
    throw error;
  }
}

// Helper for single row queries (like SQLite's db.get)
export async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper for multiple rows (like SQLite's db.all)
export async function getAll(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Helper for insert/update/delete (like SQLite's db.run)
export async function execute(text, params) {
  const result = await query(text, params);
  const returningId = result.rows[0]?.id;
  
  return {
    lastID: returningId || null,
    changes: result.rowCount || 0,
    rows: result.rows
  };
}

// Initialize database on import
// initializeDatabase().catch(console.error);