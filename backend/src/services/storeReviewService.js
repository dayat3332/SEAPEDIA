const pool = require('../config/database');
const xss = require('xss');

/**
 * Create a new review for a store based on a completed order.
 */
const createStoreReview = async ({ orderId, buyerId, rating, comment }) => {
  const sanitizedComment = xss(comment);

  const [orders] = await pool.query(
    'SELECT id, store_id, buyer_id, status FROM orders WHERE id = ?',
    [orderId]
  );

  if (orders.length === 0) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const order = orders[0];
  if (order.buyer_id !== buyerId) {
    const err = new Error('Unauthorized to review this order.');
    err.statusCode = 403;
    throw err;
  }

  if (order.status !== 'pesanan_selesai') {
    const err = new Error('You can only review completed orders.');
    err.statusCode = 400;
    throw err;
  }

  const [existingReviews] = await pool.query(
    'SELECT id FROM store_reviews WHERE order_id = ?',
    [orderId]
  );

  if (existingReviews.length > 0) {
    const err = new Error('You have already submitted a review for this order.');
    err.statusCode = 400;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO store_reviews (order_id, store_id, buyer_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [orderId, order.store_id, buyerId, rating, sanitizedComment]
  );

  return {
    id: result.insertId,
    orderId,
    storeId: order.store_id,
    buyerId,
    rating,
    comment: sanitizedComment,
  };
};

/**
 * Get reviews for a specific store.
 */
const getStoreReviews = async (storeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [reviews] = await pool.query(
    `SELECT sr.id, sr.rating, sr.comment, sr.created_at, u.full_name as reviewer_name 
     FROM store_reviews sr
     JOIN users u ON sr.buyer_id = u.id
     WHERE sr.store_id = ?
     ORDER BY sr.created_at DESC
     LIMIT ? OFFSET ?`,
    [storeId, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) as total FROM store_reviews WHERE store_id = ?',
    [storeId]
  );

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all store reviews for admin management.
 */
const getAllStoreReviews = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const [reviews] = await pool.query(
    `SELECT sr.id, sr.rating, sr.comment, sr.created_at, 
            u.full_name as reviewer_name, s.store_name
     FROM store_reviews sr
     JOIN users u ON sr.buyer_id = u.id
     JOIN stores s ON sr.store_id = s.id
     ORDER BY sr.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM store_reviews');

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Delete a store review (Admin action).
 */
const deleteStoreReview = async (id) => {
  const [result] = await pool.query('DELETE FROM store_reviews WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createStoreReview,
  getStoreReviews,
  getAllStoreReviews,
  deleteStoreReview,
};
