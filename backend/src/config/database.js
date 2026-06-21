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
    
    // Self-healing check for users table columns and demo accounts
    try {
      // Check and fix AUTO_INCREMENT for the 'id' column on ALL tables in the database
      let missingAutoInc = false;
      const [tablesResult] = await conn.query('SHOW TABLES');
      if (tablesResult.length > 0) {
        const dbNameKey = Object.keys(tablesResult[0])[0];
        const allTables = tablesResult.map(row => row[dbNameKey]);

        for (const table of allTables) {
          try {
            const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
            const idCol = cols.find(c => c.Field === 'id');
            if (idCol && !idCol.Extra.toLowerCase().includes('auto_increment')) {
              console.log(`⚠️ Table '${table}' is missing AUTO_INCREMENT on 'id' column.`);
              missingAutoInc = true;
              break;
            }
          } catch (tableErr) {
            console.error(`❌ Failed to verify columns for table ${table}:`, tableErr.message);
          }
        }

        if (missingAutoInc) {
          console.log('🚨 Critical: One or more tables are missing AUTO_INCREMENT constraints on TiDB. Re-initializing database structure...');
          
          // 1. Disable foreign key checks
          await conn.query('SET FOREIGN_KEY_CHECKS = 0');
          
          // 2. Drop all tables
          for (const table of allTables) {
            console.log(`🗑️ Dropping table ${table}...`);
            await conn.query(`DROP TABLE IF EXISTS ${table}`);
          }
          
          // 3. Read and execute schema.sql
          const fs = require('fs');
          const path = require('path');
          const schemaPath = path.join(__dirname, '../database/schema.sql');
          
          if (fs.existsSync(schemaPath)) {
            console.log('📄 Executing schema.sql to recreate tables...');
            const sql = fs.readFileSync(schemaPath, 'utf8');
            const cleanSql = sql
              .replace(/--.*$/gm, '')
              .replace(/\/\*[\s\S]*?\*\//g, '');
            const statements = cleanSql
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length > 0);
              
            for (const stmt of statements) {
              await conn.query(stmt);
            }
            console.log('✅ Tables recreated successfully with AUTO_INCREMENT constraints!');
          } else {
            console.error('❌ Could not find schema.sql at', schemaPath);
          }
          
          // 4. Re-enable foreign key checks
          await conn.query('SET FOREIGN_KEY_CHECKS = 1');
          
          // 5. Run seed runner to repopulate database
          console.log('🌱 Running seeds to repopulate data...');
          const seed = require('../database/seed-runner');
          conn.release();
          await seed();
          console.log('🎉 Database self-healing and seeding completed successfully!');
          return;
        }
      } else {
        // Database is completely empty! Recreate structure and seed
        console.log('🚨 Database is empty. Re-initializing database structure...');
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        
        if (fs.existsSync(schemaPath)) {
          console.log('📄 Executing schema.sql to recreate tables...');
          const sql = fs.readFileSync(schemaPath, 'utf8');
          const cleanSql = sql
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');
          const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
            
          for (const stmt of statements) {
            await conn.query(stmt);
          }
          console.log('✅ Tables created successfully!');
        } else {
          console.error('❌ Could not find schema.sql at', schemaPath);
        }
        
        console.log('🌱 Running seeds to populate data...');
        const seed = require('../database/seed-runner');
        conn.release();
        await seed();
        console.log('🎉 Database initialization and seeding completed successfully!');
        return;
      }

      const [columns] = await conn.query('SHOW COLUMNS FROM users');
      const columnNames = columns.map(c => c.Field);
      
      if (!columnNames.includes('verification_otp')) {
        if (columnNames.includes('verification_token')) {
          await conn.query('ALTER TABLE users CHANGE COLUMN verification_token verification_otp VARCHAR(10) DEFAULT NULL');
          console.log('✅ Renamed column verification_token to verification_otp');
        } else {
          await conn.query('ALTER TABLE users ADD COLUMN verification_otp VARCHAR(10) DEFAULT NULL AFTER is_verified');
          console.log('✅ Added missing column: verification_otp');
        }
      }
      
      if (!columnNames.includes('token_expires_at')) {
        await conn.query('ALTER TABLE users ADD COLUMN token_expires_at TIMESTAMP NULL DEFAULT NULL AFTER verification_otp');
        console.log('✅ Added missing column: token_expires_at');
      }
      
      // Auto-verify all demo accounts
      const demoEmails = [
        'admin@seapedia.com',
        'seller1@seapedia.com',
        'seller2@seapedia.com',
        'buyer1@seapedia.com',
        'buyer2@seapedia.com',
        'driver1@seapedia.com',
        'multirole@seapedia.com'
      ];
      const [verifyResult] = await conn.query(
        'UPDATE users SET is_verified = TRUE WHERE email IN (?) AND is_verified = FALSE',
        [demoEmails]
      );
      if (verifyResult.affectedRows > 0) {
        console.log(`✅ Auto-verified ${verifyResult.affectedRows} demo user accounts`);
      }
    } catch (err) {
      console.error('❌ Failed to verify/migrate users table columns:', err.message);
    }

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