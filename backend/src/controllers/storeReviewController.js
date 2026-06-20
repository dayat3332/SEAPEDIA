const storeReviewService = require('../services/storeReviewService');

const createStoreReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const buyerId = req.user.id;

    if (!orderId || !rating || !comment) {
      return res.status(400).json({ message: 'Order ID, rating, and comment are required.' });
    }

    const review = await storeReviewService.createStoreReview({
      orderId,
      buyerId,
      rating: parseInt(rating, 10),
      comment,
    });

    res.status(201).json({ message: 'Review submitted successfully.', data: review });
  } catch (err) {
    next(err);
  }
};

const getStoreReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await storeReviewService.getStoreReviews(id, page, limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getAllStoreReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await storeReviewService.getAllStoreReviews(page, limit);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

const deleteStoreReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await storeReviewService.deleteStoreReview(id);
    if (!success) {
      return res.status(404).json({ message: 'Review not found.' });
    }
    res.json({ message: 'Review deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStoreReview,
  getStoreReviews,
  getAllStoreReviews,
  deleteStoreReview,
};
