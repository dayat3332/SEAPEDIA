const pool = require('../config/database');

/**
 * Get or create cart for a user.
 */
const getOrCreateCart = async (userId, conn = pool) => {
  const [carts] = await conn.query(
    'SELECT * FROM carts WHERE user_id = ?',
    [userId]
  );
  if (carts.length > 0) {
    return carts[0];
  }
  const [result] = await conn.query(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );
  return { id: result.insertId, user_id: userId, store_id: null };
};

/**
 * Get full cart details with items and product info.
 */
const getCartDetails = async (userId) => {
  const cart = await getOrCreateCart(userId);

  const [items] = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image_url, 
            s.id as store_id, s.store_name
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     JOIN stores s ON p.store_id = s.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );

  return {
    cartId: cart.id,
    storeId: cart.store_id,
    items,
  };
};

/**
 * Add an item to the cart, enforcing the single-store checkout rule.
 */
const addItemToCart = async (userId, { productId, quantity = 1 }) => {
  if (quantity <= 0) {
    const err = new Error('Quantity must be at least 1.');
    err.statusCode = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cart = await getOrCreateCart(userId, conn);

    // Get product and check active/stock
    const [products] = await conn.query(
      'SELECT id, store_id, stock, is_active, name FROM products WHERE id = ?',
      [productId]
    );
    if (products.length === 0 || !products[0].is_active) {
      const err = new Error('Product not found or inactive.');
      err.statusCode = 404;
      throw err;
    }

    const product = products[0];

    // Enforce single-store rule
    if (cart.store_id !== null && cart.store_id !== product.store_id) {
      const err = new Error('Single-store checkout: Cart can only contain products from one store. Clear your cart to add products from another store.');
      err.statusCode = 409; // Conflict
      throw err;
    }

    // Check existing item in cart
    const [existingItems] = await conn.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, productId]
    );

    const currentQtyInCart = existingItems.length > 0 ? existingItems[0].quantity : 0;
    const targetQty = currentQtyInCart + quantity;

    if (targetQty > product.stock) {
      const err = new Error(`Cannot add. Total quantity in cart (${targetQty}) exceeds available stock (${product.stock}).`);
      err.statusCode = 400;
      throw err;
    }

    // Update cart store_id if it was null
    if (cart.store_id === null) {
      await conn.query('UPDATE carts SET store_id = ? WHERE id = ?', [product.store_id, cart.id]);
    }

    // Insert or update cart item
    if (existingItems.length > 0) {
      await conn.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [targetQty, existingItems[0].id]
      );
    } else {
      await conn.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cart.id, productId, quantity]
      );
    }

    await conn.commit();
    return await getCartDetails(userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Update the quantity of a product in the cart.
 */
const updateItemQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    // If quantity is 0 or less, remove item instead
    return await removeItemFromCart(userId, productId);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cart = await getOrCreateCart(userId, conn);

    // Verify item in cart
    const [existing] = await conn.query(
      'SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, productId]
    );
    if (existing.length === 0) {
      const err = new Error('Product is not in your cart.');
      err.statusCode = 404;
      throw err;
    }

    // Check stock
    const [products] = await conn.query(
      'SELECT stock FROM products WHERE id = ?',
      [productId]
    );
    if (products.length === 0) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    if (quantity > products[0].stock) {
      const err = new Error(`Requested quantity (${quantity}) exceeds available stock (${products[0].stock}).`);
      err.statusCode = 400;
      throw err;
    }

    await conn.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cart.id, productId]
    );

    await conn.commit();
    return await getCartDetails(userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Remove an item from the cart.
 */
const removeItemFromCart = async (userId, productId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cart = await getOrCreateCart(userId, conn);

    await conn.query(
      'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, productId]
    );

    // If cart is now empty, reset store_id to null
    const [remaining] = await conn.query(
      'SELECT id FROM cart_items WHERE cart_id = ? LIMIT 1',
      [cart.id]
    );
    if (remaining.length === 0) {
      await conn.query('UPDATE carts SET store_id = NULL WHERE id = ?', [cart.id]);
    }

    await conn.commit();
    return await getCartDetails(userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Clear all items in the cart and reset store_id to null.
 */
const clearCart = async (userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const cart = await getOrCreateCart(userId, conn);

    await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    await conn.query('UPDATE carts SET store_id = NULL WHERE id = ?', [cart.id]);

    await conn.commit();
    return { cartId: cart.id, storeId: null, items: [] };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getCartDetails,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
};
