const pool = require('../config/database');

/**
 * Get all active products for public catalog.
 */
const getProducts = async ({ page = 1, limit = 12, search = '', storeId = null }) => {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE p.is_active = TRUE';
  const params = [];

  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (storeId) {
    whereClause += ' AND p.store_id = ?';
    params.push(storeId);
  }

  const [products] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url, p.created_at,
            s.id as store_id, s.store_name, s.image_url as store_image_url
     FROM products p
     JOIN stores s ON p.store_id = s.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM products p JOIN stores s ON p.store_id = s.id ${whereClause}`,
    params
  );

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single product detail.
 */
const getProductById = async (id) => {
  const [products] = await pool.query(
    `SELECT p.*, s.id as store_id, s.store_name, s.description as store_description, s.image_url as store_image_url
     FROM products p
     JOIN stores s ON p.store_id = s.id
     WHERE p.id = ? AND p.is_active = TRUE`,
    [id]
  );

  if (products.length === 0) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  return products[0];
};

/**
 * Get all products (active and inactive) for a specific store (for Seller dashboard).
 */
const getProductsByStoreId = async (storeId) => {
  const [products] = await pool.query(
    'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC',
    [storeId]
  );
  return products;
};

/**
 * Create a new product.
 */
const createProduct = async ({ storeId, name, description, price, stock, imageUrl = null }) => {
  const [result] = await pool.query(
    'INSERT INTO products (store_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [storeId, name, description, price, stock, imageUrl]
  );
  return { id: result.insertId, storeId, name, description, price, stock, imageUrl };
};

/**
 * Update an existing product.
 */
const updateProduct = async (productId, storeId, { name, description, price, stock, imageUrl = null, isActive = true }) => {
  const [result] = await pool.query(
    `UPDATE products 
     SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, is_active = ? 
     WHERE id = ? AND store_id = ?`,
    [name, description, price, stock, imageUrl, isActive, productId, storeId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Product not found or not owned by your store.');
    err.statusCode = 404;
    throw err;
  }

  return { id: productId, storeId, name, description, price, stock, imageUrl, isActive };
};

/**
 * Delete a product.
 */
const deleteProduct = async (productId, storeId) => {
  const [result] = await pool.query(
    'DELETE FROM products WHERE id = ? AND store_id = ?',
    [productId, storeId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Product not found or not owned by your store.');
    err.statusCode = 404;
    throw err;
  }

  return true;
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByStoreId,
  createProduct,
  updateProduct,
  deleteProduct,
};
