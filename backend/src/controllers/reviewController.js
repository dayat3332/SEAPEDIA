const reviewService = require('../services/reviewService');

const createReview = async (req, res, next) => {
  try {
    const { reviewerName, rating, comment } = req.body;
    const userId = req.user ? req.user.id : null;
    const review = await reviewService.createReview({ userId, reviewerName, rating, comment });
    res.status(201).json({ message: 'Review submitted successfully.', data: review });
  } catch (err) {
    next(err);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await reviewService.getReviews(page, limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await reviewService.deleteReview(id);
    if (!success) {
      const err = new Error('Review not found.');
      err.statusCode = 404;
      throw err;
    }
    res.json({ message: 'Review deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getReviews, deleteReview };
