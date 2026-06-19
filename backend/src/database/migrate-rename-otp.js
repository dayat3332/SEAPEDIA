/**
 * Migration: Rename verification_token → verification_otp in users table.
 * Run: node src/database/migrate-rename-otp.js
 */
const pool = require('../config/database');

const migrate = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Starting migration: Rename verification_token → verification_otp...');

    // Check if old column exists
    const [oldCol] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_token'`
    );

    if (oldCol.length > 0) {
      await conn.query(`
        ALTER TABLE users CHANGE COLUMN verification_token verification_otp VARCHAR(10) DEFAULT NULL
      `);
      console.log('✅ Renamed column: verification_token → verification_otp');
    } else {
      // Check if new column already exists
      const [newCol] = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_otp'`
      );
      if (newCol.length > 0) {
        console.log('⚠️  Column verification_otp already exists. Skipping.');
      } else {
        console.log('❌ Neither column found. Something is wrong.');
      }
    }

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
};

migrate();
