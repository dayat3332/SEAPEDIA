const pool = require('../config/database');
const xss = require('xss');

/**
 * Create a new app review.
 */
const createReview = async ({ userId, reviewerName, rating, comment }) => {
  const sanitizedComment = xss(comment);
  const sanitizedName = xss(reviewerName);

  const [result] = await pool.query(
    'INSERT INTO app_reviews (user_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?)',
    [userId || null, sanitizedName, rating, sanitizedComment]
  );

  return {
    id: result.insertId,
    reviewer_name: sanitizedName,
    rating,
    comment: sanitizedComment,
  };
};

/**
 * Get all app reviews, ordered by newest first.
 */
const getReviews = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [reviews] = await pool.query(
    'SELECT id, reviewer_name, rating, comment, created_at FROM app_reviews ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM app_reviews');

  // Get average rating
  const [[{ avgRating }]] = await pool.query('SELECT COALESCE(AVG(rating), 0) as avgRating FROM app_reviews');

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    averageRating: parseFloat(Number(avgRating).toFixed(1)),
  };
};

/**
 * Delete an app review.
 */
const deleteReview = async (id) => {
  const [result] = await pool.query('DELETE FROM app_reviews WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { createReview, getReviews, deleteReview };
