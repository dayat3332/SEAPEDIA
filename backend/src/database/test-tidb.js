const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2gS7hETzrFKb479.root',
  password: 'ZjvmEiV7tdf6eshh',
  // database: 'seapedia',
  // ssl: {
  //   rejectUnauthorized: false,
  // },
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
};

async function test() {
  console.log('Connecting to TiDB Cloud...');
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!');
    
    // Check if users table exists and count users
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Table "users" exists. Row count: ${rows[0].count}`);
    
    // Check user admin1
    const [adminRows] = await connection.query("SELECT username, email, is_verified FROM users WHERE username = 'admin1'");
    if (adminRows.length > 0) {
      console.log('✅ User "admin1" exists:', adminRows[0]);
    } else {
      console.log('❌ User "admin1" not found in the database!');
    }
    
    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();
