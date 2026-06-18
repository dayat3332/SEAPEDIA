const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const storeController = require('../controllers/storeController');

// Protected route to get current seller's store (Seller only)
// Place this before /:id so it doesn't get captured by the parameterized route.
router.get('/my', auth, roleGuard(['seller']), storeController.getMyStore);

// Public route to get store summary by ID
router.get('/:id', storeController.getStoreSummary);

// Protected routes (Seller only)
router.use(auth);
router.use(roleGuard(['seller']));

router.post(
  '/',
  [
    body('storeName').trim().isLength({ min: 3, max: 100 }).withMessage('Store name must be 3-100 characters.'),
    body('description').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Valid image URL is required.'),
    validate,
  ],
  storeController.createStore
);

router.put(
  '/my',
  [
    body('storeName').trim().isLength({ min: 3, max: 100 }).withMessage('Store name must be 3-100 characters.'),
    body('description').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Valid image URL is required.'),
    validate,
  ],
  storeController.updateStore
);

module.exports = router;
