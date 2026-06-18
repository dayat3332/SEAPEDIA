const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const cartController = require('../controllers/cartController');

router.use(auth);
router.use(roleGuard('buyer'));

// GET /api/cart
router.get('/', cartController.getCart);

// POST /api/cart/items
router.post(
  '/items',
  [
    body('productId').isInt().withMessage('Product ID must be an integer.'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be an integer >= 1.'),
    validate,
  ],
  cartController.addItem
);

// PUT /api/cart/items/:productId
router.put(
  '/items/:productId',
  [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be an integer >= 0.'),
    validate,
  ],
  cartController.updateItem
);

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', cartController.removeItem);

// DELETE /api/cart
router.delete('/', cartController.clearCart);

module.exports = router;
