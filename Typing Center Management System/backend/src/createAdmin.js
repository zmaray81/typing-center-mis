import bcrypt from 'bcrypt';
import { getDb, execute } from './db.js';

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user for PostgreSQL...');
    
    // Get database connection
    getDb(); // Initialize connection
    
    // Check if admin already exists
    const existingAdmin = await execute(
      "SELECT id FROM users WHERE username = 'admin'",
      []
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash password (default: admin123)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    const result = await execute(
      `INSERT INTO users (
        username, password_hash, full_name, email, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        'admin', 
        passwordHash, 
        'System Administrator', 
        'admin@typingcenter.com', 
        'admin',
        true  // PostgreSQL uses boolean
      ]
    );
    
    console.log('✅ Default admin user created');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('📋 User ID:', result.rows[0]?.id);
    console.log('⚠️ Please change the password after first login!');
    
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    console.error('Full error details:', err.message);
  }
}

// Run only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default createAdminUser;