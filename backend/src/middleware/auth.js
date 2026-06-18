const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verify JWT token and attach user info to request.
 * Sets req.user = { id, username, activeRole, roles }
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Optional auth — doesn't fail if no token, just sets req.user if valid.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { auth, optionalAuth };
