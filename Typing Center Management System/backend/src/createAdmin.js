import bcrypt from 'bcrypt';
import { getDb } from './db.js';

async function createAdminUser() {
  try {
    const db = await getDb();
    
    // Check if admin already exists
    const existingAdmin = await db.get(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash password (default: admin123)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    await db.run(
      `INSERT INTO users (
        username, password_hash, full_name, email, role
      ) VALUES (?, ?, ?, ?, ?)`,
      ['admin', passwordHash, 'System Administrator', 'admin@typingcenter.com', 'admin']
    );
    
    console.log('✅ Default admin user created');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('⚠️ Please change the password after first login!');
    
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
  }
}

createAdminUser();