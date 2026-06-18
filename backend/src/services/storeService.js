const pool = require('../config/database');

/**
 * Get store by user ID.
 */
const getStoreByUserId = async (userId) => {
  const [stores] = await pool.query(
    'SELECT * FROM stores WHERE user_id = ?',
    [userId]
  );
  return stores[0] || null;
};

/**
 * Get store by store ID.
 */
const getStoreById = async (id) => {
  const [stores] = await pool.query(
    'SELECT s.*, u.full_name as owner_name FROM stores s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
    [id]
  );
  return stores[0] || null;
};

/**
 * Check if store name is unique.
 */
const isStoreNameUnique = async (storeName, excludeStoreId = null) => {
  let query = 'SELECT id FROM stores WHERE store_name = ?';
  const params = [storeName];
  if (excludeStoreId) {
    query += ' AND id != ?';
    params.push(excludeStoreId);
  }
  const [stores] = await pool.query(query, params);
  return stores.length === 0;
};

/**
 * Create a new store for a seller.
 */
const createStore = async ({ userId, storeName, description, imageUrl = null }) => {
  // Check if seller already has a store
  const existingStore = await getStoreByUserId(userId);
  if (existingStore) {
    const err = new Error('You already own a store.');
    err.statusCode = 400;
    throw err;
  }

  // Check unique store name
  const isUnique = await isStoreNameUnique(storeName);
  if (!isUnique) {
    const err = new Error('Store name is already taken.');
    err.statusCode = 400;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO stores (user_id, store_name, description, image_url) VALUES (?, ?, ?, ?)',
    [userId, storeName, description, imageUrl]
  );

  return { id: result.insertId, userId, storeName, description, imageUrl };
};

/**
 * Update an existing store.
 */
const updateStore = async (userId, { storeName, description, imageUrl = null }) => {
  const store = await getStoreByUserId(userId);
  if (!store) {
    const err = new Error('Store not found.');
    err.statusCode = 404;
    throw err;
  }

  // Check unique store name excluding current store
  const isUnique = await isStoreNameUnique(storeName, store.id);
  if (!isUnique) {
    const err = new Error('Store name is already taken.');
    err.statusCode = 400;
    throw err;
  }

  await pool.query(
    'UPDATE stores SET store_name = ?, description = ?, image_url = ? WHERE user_id = ?',
    [storeName, description, imageUrl, userId]
  );

  return { id: store.id, userId, storeName, description, imageUrl };
};

module.exports = {
  getStoreByUserId,
  getStoreById,
  isStoreNameUnique,
  createStore,
  updateStore,
};
