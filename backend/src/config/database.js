const mysql = require('mysql2/promise');
const env = require('./env');

const dbConfig = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Logika cerdas untuk mendeteksi lingkungan GCP (Unix Socket) vs Lokal (Host)
if (process.env.DB_SOCKET_PATH) {
  dbConfig.socketPath = process.env.DB_SOCKET_PATH;
} else {
  dbConfig.host = env.DB_HOST;
  dbConfig.port = env.DB_PORT;
}

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;