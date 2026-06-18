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
  .then(async (conn) => {
    console.log('✅ MySQL connected successfully');
    
    // Auto-create uploaded_files table for stateless environments
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          data LONGBLOB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_filename (filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ uploaded_files table verified/created');
    } catch (err) {
      console.error('❌ Failed to verify/create uploaded_files table:', err.message);
    }
    
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;