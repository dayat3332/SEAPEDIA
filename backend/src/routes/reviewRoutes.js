const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth, optionalAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const reviewController = require('../controllers/reviewController');

// GET /api/reviews
router.get('/', reviewController.getReviews);

// POST /api/reviews
router.post(
  '/',
  optionalAuth,
  [
    body('reviewerName').trim().isLength({ min: 1, max: 100 }).withMessage('Reviewer name is required (max 100 chars).'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
    body('comment').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment is required (max 2000 chars).'),
    validate,
  ],
  reviewController.createReview
);

// DELETE /api/reviews/:id (Admin only)
router.delete('/:id', auth, roleGuard('admin'), reviewController.deleteReview);

module.exports = router;
