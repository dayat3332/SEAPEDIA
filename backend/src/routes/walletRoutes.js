const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const walletController = require('../controllers/walletController');

router.use(auth);
router.use(roleGuard('buyer'));

// GET /api/wallet
router.get('/', walletController.getWallet);

// POST /api/wallet/topup
router.post(
  '/topup',
  [
    body('amount').isFloat({ min: 1000 }).withMessage('Top-up amount must be at least Rp 1.000.'),
    validate,
  ],
  walletController.topup
);

module.exports = router;
