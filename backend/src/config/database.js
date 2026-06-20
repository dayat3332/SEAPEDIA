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

if (process.env.DB_SOCKET_PATH) {
  dbConfig.socketPath = process.env.DB_SOCKET_PATH;
} else {
  dbConfig.host = env.DB_HOST;
  dbConfig.port = env.DB_PORT;
  if (env.DB_SSL) {
    dbConfig.ssl = {
      rejectUnauthorized: false,
    };
  }
}

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(async (conn) => {
    console.log('✅ MySQL connected successfully');
    

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

    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS store_reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          store_id INT NOT NULL,
          buyer_id INT NOT NULL,
          rating TINYINT NOT NULL,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_order_review (order_id),
          CONSTRAINT fk_store_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_store_reviews_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          CONSTRAINT fk_store_reviews_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT chk_store_rating CHECK (rating >= 1 AND rating <= 5)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ store_reviews table verified/created');
    } catch (err) {
      console.error('❌ Failed to verify/create store_reviews table:', err.message);
    }
    
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;