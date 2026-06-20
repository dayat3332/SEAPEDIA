const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const storeController = require('../controllers/storeController');
const storeReviewController = require('../controllers/storeReviewController');

router.get('/my', auth, roleGuard(['seller']), storeController.getMyStore);

router.get('/:id/reviews', storeReviewController.getStoreReviews);

router.get('/:id', storeController.getStoreSummary);

router.use(auth);
router.use(roleGuard(['seller']));

router.post(
  '/',
  [
    body('storeName').trim().isLength({ min: 3, max: 100 }).withMessage('Store name must be 3-100 characters.'),
    body('description').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
    body('imageUrl').optional({ checkFalsy: true }).isString().withMessage('Valid image URL or path is required.'),
    validate,
  ],
  storeController.createStore
);

router.put(
  '/my',
  [
    body('storeName').trim().isLength({ min: 3, max: 100 }).withMessage('Store name must be 3-100 characters.'),
    body('description').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
    body('imageUrl').optional({ checkFalsy: true }).isString().withMessage('Valid image URL or path is required.'),
    validate,
  ],
  storeController.updateStore
);

module.exports = router;
