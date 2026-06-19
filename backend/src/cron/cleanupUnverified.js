const cron = require('node-cron');
const pool = require('../config/database');

/**
 * Cron Job: Auto-cleanup akun yang belum terverifikasi.
 * Berjalan setiap tengah malam (00:00).
 * Menghapus semua user yang:
 *   - is_verified = FALSE
 *   - created_at lebih dari 24 jam yang lalu
 */
const startCleanupCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 [CRON] Running unverified accounts cleanup...');
    try {
      const [result] = await pool.query(
        `DELETE FROM users 
         WHERE is_verified = FALSE 
         AND created_at < NOW() - INTERVAL 24 HOUR`
      );
      console.log(`🧹 [CRON] Cleaned up ${result.affectedRows} unverified account(s).`);
    } catch (err) {
      console.error('❌ [CRON] Cleanup failed:', err.message);
    }
  }, {
    timezone: 'Asia/Jakarta',
  });

  console.log('⏰ Cron job scheduled: Cleanup unverified users at 00:00 WIB daily');
};

module.exports = { startCleanupCron };
