const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const env = require('../config/env');
const { sendVerificationEmail } = require('./emailService');

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
 * Generate a random 6-digit OTP code.
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Register a new user with selected roles.
 * User starts as unverified. An OTP is sent to their email.
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

    // Generate OTP verification code
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam dari sekarang

    // Insert user with is_verified = FALSE and verification token
    const [result] = await conn.query(
      `INSERT INTO users (username, email, phone, password_hash, full_name, is_verified, verification_token, token_expires_at) 
       VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)`,
      [username, email, phone || null, passwordHash, fullName, otpCode, otpExpiry]
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

    // Send verification email (async, non-blocking untuk response)
    sendVerificationEmail(email, otpCode).catch((err) => {
      console.error('❌ Failed to send verification email:', err.message);
    });

    return {
      id: userId,
      username,
      email,
      fullName,
      roles,
      isVerified: false,
      message: 'Kode OTP telah dikirim ke email Anda. Silakan verifikasi untuk mengaktifkan akun.',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Verify email with OTP code.
 */
const verifyEmail = async ({ email, otpCode }) => {
  const [users] = await pool.query(
    'SELECT id, username, verification_token, token_expires_at, is_verified FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    const err = new Error('Email tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const user = users[0];

  if (user.is_verified) {
    const err = new Error('Akun ini sudah terverifikasi.');
    err.statusCode = 400;
    throw err;
  }

  if (user.verification_token !== otpCode) {
    const err = new Error('Kode OTP tidak valid.');
    err.statusCode = 400;
    throw err;
  }

  if (new Date() > new Date(user.token_expires_at)) {
    const err = new Error('Kode OTP sudah kedaluwarsa. Silakan daftar ulang.');
    err.statusCode = 400;
    throw err;
  }

  // Update user: set verified, clear token
  await pool.query(
    'UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
    [user.id]
  );

  return { message: 'Email berhasil diverifikasi! Akun Anda sekarang aktif.' };
};

/**
 * Resend OTP verification code.
 */
const resendOTP = async ({ email }) => {
  const [users] = await pool.query(
    'SELECT id, is_verified FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    const err = new Error('Email tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  const user = users[0];

  if (user.is_verified) {
    const err = new Error('Akun ini sudah terverifikasi.');
    err.statusCode = 400;
    throw err;
  }

  const otpCode = generateOTP();
  const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    'UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?',
    [otpCode, otpExpiry, user.id]
  );

  await sendVerificationEmail(email, otpCode);

  return { message: 'Kode OTP baru telah dikirim ke email Anda.' };
};

/**
 * Login: validate credentials, return user info + roles.
 * Blocks login if email is not verified.
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

  // Block unverified users from logging in
  if (!user.is_verified) {
    const err = new Error('Email belum diverifikasi. Silakan cek inbox email Anda untuk kode OTP.');
    err.statusCode = 403;
    throw err;
  }

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

module.exports = { register, verifyEmail, resendOTP, login, selectRole, getProfile };
