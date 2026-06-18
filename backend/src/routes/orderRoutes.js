const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const orderController = require('../controllers/orderController');

router.use(auth);

// GET /api/orders/buyer (Buyer only)
router.get('/buyer', roleGuard('buyer'), orderController.getBuyerOrders);

// GET /api/orders/seller (Seller only)
router.get('/seller', roleGuard('seller'), orderController.getSellerOrders);

// POST /api/orders/checkout (Buyer only)
router.post(
  '/checkout',
  roleGuard('buyer'),
  [
    body('addressId').isInt().withMessage('Address ID is required.'),
    body('deliveryMethod').isIn(['instant', 'next_day', 'regular']).withMessage('Invalid delivery method.'),
    validate,
  ],
  orderController.checkout
);

// GET /api/orders/:id (Authenticated users, access verified in service)
router.get('/:id', orderController.getOrderDetail);

// PUT /api/orders/:id/status (Authenticated users, updates status)
router.put('/:id/status', orderController.updateStatus);

module.exports = router;
