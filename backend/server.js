const app = require('./src/app');
const env = require('./src/config/env');
const { startCleanupCron } = require('./src/cron/cleanupUnverified');

app.listen(env.PORT, () => {
  console.log(`🚀 SEAPEDIA API running on http://localhost:${env.PORT}`);
  console.log(`📋 Environment: ${env.NODE_ENV}`);

  // Start cron jobs
  startCleanupCron();
});
