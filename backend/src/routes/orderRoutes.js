const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const orderController = require('../controllers/orderController');
const storeReviewController = require('../controllers/storeReviewController');

router.use(auth);

router.get('/buyer', roleGuard('buyer'), orderController.getBuyerOrders);

router.get('/seller', roleGuard('seller'), orderController.getSellerOrders);

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

router.get('/:id', orderController.getOrderDetail);

router.put('/:id/status', orderController.updateStatus);

router.post(
  '/review',
  roleGuard('buyer'),
  [
    body('orderId').isInt().withMessage('Order ID is required.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
    body('comment').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment is required (max 2000 chars).'),
    validate,
  ],
  storeReviewController.createStoreReview
);

module.exports = router;
