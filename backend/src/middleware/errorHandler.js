/**
 * Global error handler middleware.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('🔥 Error:', err.stack || err.message);

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token has expired.' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Duplicate entry. This resource already exists.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error.';
  
  const response = { message };
  if (err.email) {
    response.email = err.email;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
