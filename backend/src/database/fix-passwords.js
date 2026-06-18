const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function fixPasswords() {
  try {
    console.log('🔄 Generating password hash for Password123!...');
    const hash = await bcrypt.hash('Password123!', 10);
    
    console.log('⚡ Updating password_hash for all demo users...');
    const [result] = await pool.query('UPDATE users SET password_hash = ?', [hash]);
    
    console.log(`✅ Success! Updated ${result.affectedRows} user password hashes.`);
  } catch (err) {
    console.error('❌ Failed to update password hashes:', err);
  } finally {
    process.exit(0);
  }
}

fixPasswords();
