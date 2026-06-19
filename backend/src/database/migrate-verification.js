/**
 * Migration: Add email verification columns to users table.
 * Run: node src/database/migrate-verification.js
 */
const pool = require('../config/database');

const migrate = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Starting migration: Add verification columns...');

    // Check if columns already exist
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_verified'`
    );

    if (columns.length > 0) {
      console.log('⚠️  Columns already exist. Skipping ALTER TABLE.');
    } else {
      await conn.query(`
        ALTER TABLE users 
          ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER full_name,
          ADD COLUMN verification_token VARCHAR(10) DEFAULT NULL AFTER is_verified,
          ADD COLUMN token_expires_at TIMESTAMP NULL DEFAULT NULL AFTER verification_token
      `);
      console.log('✅ Added columns: is_verified, verification_token, token_expires_at');
    }

    // Set all existing users as verified so they are not locked out
    const [result] = await conn.query(
      'UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE'
    );
    console.log(`✅ Set ${result.affectedRows} existing user(s) as verified.`);

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
};

migrate();
