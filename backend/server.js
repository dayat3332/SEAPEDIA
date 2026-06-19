const app = require('./src/app');
const env = require('./src/config/env');
const { startCleanupCron } = require('./src/cron/cleanupUnverified');
const migrateVerification = require('./src/database/migrate-verification');
const migrateRenameOtp = require('./src/database/migrate-rename-otp');

const startServer = async () => {
  try {
    // Run database migrations on startup
    console.log('⚙️ Running database migrations...');
    await migrateVerification();
    await migrateRenameOtp();
    console.log('✅ All migrations applied successfully!');
  } catch (err) {
    console.error('⚠️ Migration runner encountered an error:', err.message);
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
