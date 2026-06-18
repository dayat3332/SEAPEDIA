const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const addressController = require('../controllers/addressController');

router.use(auth);
router.use(roleGuard('buyer'));

// GET /api/addresses
router.get('/', addressController.getAddresses);

// POST /api/addresses
router.post(
  '/',
  [
    body('label').trim().isLength({ min: 1, max: 50 }).withMessage('Label is required (max 50 characters).'),
    body('recipientName').trim().isLength({ min: 2, max: 100 }).withMessage('Recipient name must be at least 2 characters.'),
    body('phone').trim().isLength({ min: 8, max: 20 }).withMessage('Valid phone number is required.'),
    body('fullAddress').trim().isLength({ min: 5, max: 1000 }).withMessage('Full address must be at least 5 characters.'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
    validate,
  ],
  addressController.createAddress
);

// PUT /api/addresses/:id
router.put(
  '/:id',
  [
    body('label').trim().isLength({ min: 1, max: 50 }).withMessage('Label is required (max 50 characters).'),
    body('recipientName').trim().isLength({ min: 2, max: 100 }).withMessage('Recipient name must be at least 2 characters.'),
    body('phone').trim().isLength({ min: 8, max: 20 }).withMessage('Valid phone number is required.'),
    body('fullAddress').trim().isLength({ min: 5, max: 1000 }).withMessage('Full address must be at least 5 characters.'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
    validate,
  ],
  addressController.updateAddress
);

// DELETE /api/addresses/:id
router.delete('/:id', addressController.deleteAddress);

// PUT /api/addresses/:id/default
router.put('/:id/default', addressController.setDefaultAddress);

module.exports = router;
