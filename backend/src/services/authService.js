const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const env = require('../config/env');

/**
 * Generate a JWT token with user info and active role.
 */
const generateToken = (user, activeRole = null) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      roles: user.roles,
      activeRole,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user with selected roles.
 */
const register = async ({ username, email, phone, password, fullName, roles }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check existing username or email
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      const err = new Error('Username or email already exists.');
      err.statusCode = 409;
      throw err;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await conn.query(
      'INSERT INTO users (username, email, phone, password_hash, full_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, phone || null, passwordHash, fullName]
    );
    const userId = result.insertId;

    // Insert roles
    for (const role of roles) {
      await conn.query(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [userId, role]
      );
    }

    // Create wallet if buyer role
    if (roles.includes('buyer')) {
      await conn.query('INSERT INTO wallets (user_id) VALUES (?)', [userId]);
      await conn.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    }

    await conn.commit();
    return { id: userId, username, email, fullName, roles };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Login: validate credentials, return user info + roles.
 */
const login = async ({ username, password }) => {
  const [users] = await pool.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (users.length === 0) {
    const err = new Error('Invalid username or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid username or password.');
    err.statusCode = 401;
    throw err;
  }

  // Get roles
  const [roleRows] = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = ?',
    [user.id]
  );
  const roles = roleRows.map((r) => r.role);

  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    roles,
  };

  // If only one role, auto-select it
  const activeRole = roles.length === 1 ? roles[0] : null;
  const token = generateToken(userData, activeRole);

  return { user: userData, token, activeRole };
};

/**
 * Select active role for the session. Generates a new token with the active role.
 */
const selectRole = async (userId, role) => {
  const [roleRows] = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
    [userId, role]
  );

  if (roleRows.length === 0) {
    const err = new Error('You do not have this role.');
    err.statusCode = 403;
    throw err;
  }

  // Get full user info
  const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  const [allRoles] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [userId]);

  const user = users[0];
  const roles = allRoles.map((r) => r.role);

  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    roles,
  };

  const token = generateToken(userData, role);

  return { user: userData, token, activeRole: role };
};

/**
 * Get current user profile.
 */
const getProfile = async (userId) => {
  const [users] = await pool.query(
    'SELECT id, username, email, phone, full_name, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const [roleRows] = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = ?',
    [userId]
  );

  const user = users[0];
  user.roles = roleRows.map((r) => r.role);

  // Get wallet balance if buyer
  if (user.roles.includes('buyer')) {
    const [wallets] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [userId]);
    user.walletBalance = wallets.length > 0 ? wallets[0].balance : 0;
  }

  return user;
};

module.exports = { register, login, selectRole, getProfile };
