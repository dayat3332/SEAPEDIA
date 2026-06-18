const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function testPassword() {
  const [users] = await pool.query('SELECT * FROM users WHERE username = "admin1"');
  if (users.length === 0) {
    console.log('No user found');
    process.exit(0);
  }
  const user = users[0];
  console.log('User found:', user.username);
  console.log('Password hash in DB:', user.password_hash);
  const inputPassword = 'Password123!';
  const isMatch = await bcrypt.compare(inputPassword, user.password_hash);
  console.log('Does "Password123!" match?', isMatch);

  // Let's also compare with the placeholder
  const isPlaceholder = user.password_hash === '$2b$10$placeholder_hash_replace_on_first_run';
  console.log('Is it the placeholder?', isPlaceholder);

  process.exit(0);
}

testPassword();
