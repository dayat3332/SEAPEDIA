const app = require('./src/app');
const env = require('./src/config/env');
const { startCleanupCron } = require('./src/cron/cleanupUnverified');
const migrateVerification = require('./src/database/migrate-verification');
const migrateRenameOtp = require('./src/database/migrate-rename-otp');
const seed = require('./src/database/seed-runner');

const startServer = async () => {
  try {
    // Run database migrations on startup
    console.log('⚙️ Running database migrations...');
    await migrateVerification();
    await migrateRenameOtp();
    console.log('✅ All migrations applied successfully!');

    // Auto-seed demo data if admin1 doesn't exist
    console.log('⚙️ Checking demo accounts seed...');
    await seed();
    console.log('✅ Demo accounts seed checked/applied!');
  } catch (err) {
    console.error('⚠️ Migration/Seed runner encountered an error:', err.message);
    // Don't crash the server so it can still report errors or run if DB is already migrated
  }


  app.listen(env.PORT, () => {
    console.log(`🚀 SEAPEDIA API running on http://localhost:${env.PORT}`);
    console.log(`📋 Environment: ${env.NODE_ENV}`);

    // Start cron jobs
    startCleanupCron();
  });
};

startServer();
