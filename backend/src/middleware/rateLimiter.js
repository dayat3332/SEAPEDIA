const rateLimit = require('express-rate-limit');

/**
 * Rate limiter khusus untuk route register.
 * Membatasi 3 request per jam dari satu IP address.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Terlalu banyak percobaan pendaftaran dari IP ini. Silakan coba lagi setelah 1 jam.',
      retryAfter: '1 jam',
    });
  },
});

module.exports = { registerLimiter };
