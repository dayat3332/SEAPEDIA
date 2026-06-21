const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { registerLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

// POST /api/auth/register (Rate Limited: 3 req/hour per IP)
router.post(
  '/register',
  registerLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters.'),
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('roles')
      .isArray({ min: 1 })
      .withMessage('At least one role must be selected.')
      .custom((roles) => {
        const validRoles = ['seller', 'buyer', 'driver'];
        for (const role of roles) {
          if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
          }
        }
        return true;
      }),
    validate,
  ],
  authController.register
);

// POST /api/auth/verify-otp (juga mendukung /verify-email)
router.post(
  '/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('otpCode')
      .trim()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP code must be a 6-digit number.'),
    validate,
  ],
  authController.verifyEmail
);

// Alias: /verify-email juga tetap bisa dipakai
router.post(
  '/verify-email',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('otpCode')
      .trim()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP code must be a 6-digit number.'),
    validate,
  ],
  authController.verifyEmail
);

// POST /api/auth/resend-otp
router.post(
  '/resend-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    validate,
  ],
  authController.resendOTP
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
    validate,
  ],
  authController.login
);

// POST /api/auth/select-role
router.post(
  '/select-role',
  auth,
  [
    body('role')
      .isIn(['admin', 'seller', 'buyer', 'driver'])
      .withMessage('Invalid role.'),
    validate,
  ],
  authController.selectRole
);

// GET /api/auth/profile
router.get('/profile', auth, authController.getProfile);

module.exports = router;

