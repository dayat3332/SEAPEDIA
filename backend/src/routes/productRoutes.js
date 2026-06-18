const router = require('express').Router();
const productController = require('../controllers/productController');

const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/seller (Seller only)
router.get('/seller', auth, roleGuard(['seller']), productController.getSellerProducts);

const upload = require('../middleware/upload');

// GET /api/products/:id
router.get('/:id', productController.getProductById);

// Protected routes (Seller only)
router.post('/upload', auth, roleGuard(['seller']), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, productController.uploadProductImage);

router.post(
  '/',
  auth,
  roleGuard(['seller']),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  [
    body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters.'),
    body('description').optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
    body('price').isFloat({ min: 1 }).withMessage('Price must be a positive number.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be an integer >= 0.'),
    body('imageUrl').optional({ checkFalsy: true }).isString().withMessage('Valid image URL or path is required.'),
    validate,
  ],
  productController.createProduct
);

router.put(
  '/:id',
  auth,
  roleGuard(['seller']),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  [
    body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters.'),
    body('description').optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
    body('price').isFloat({ min: 1 }).withMessage('Price must be a positive number.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be an integer >= 0.'),
    body('imageUrl').optional({ checkFalsy: true }).isString().withMessage('Valid image URL or path is required.'),
    body('isActive').optional().customSanitizer(val => val === 'true' || val === true || val === '1' || val === 1),
    validate,
  ],
  productController.updateProduct
);

router.delete('/:id', auth, roleGuard(['seller']), productController.deleteProduct);

module.exports = router;
