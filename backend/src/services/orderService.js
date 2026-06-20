const pool = require('../config/database');

/**
 * Generate a unique order number.
 */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
};

/**
 * Perform checkout for a buyer.
 */
const checkout = async (userId, { addressId, deliveryMethod, discountCode }) => {
  const validMethods = ['instant', 'next_day', 'regular'];
  if (!validMethods.includes(deliveryMethod)) {
    const err = new Error('Invalid delivery method. Must be instant, next_day, or regular.');
    err.statusCode = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [carts] = await conn.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (carts.length === 0) {
      const err = new Error('Cart not found.');
      err.statusCode = 404;
      throw err;
    }
    const cart = carts[0];

    const [cartItems] = await conn.query(
      `SELECT ci.*, p.name, p.price, p.stock, p.store_id, p.is_active 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cart.id]
    );

    if (cartItems.length === 0) {
      const err = new Error('Your cart is empty.');
      err.statusCode = 400;
      throw err;
    }

    const storeId = cart.store_id;

    const [addresses] = await conn.query(
      'SELECT * FROM delivery_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    if (addresses.length === 0) {
      const err = new Error('Delivery address not found.');
      err.statusCode = 404;
      throw err;
    }
    const address = addresses[0];
    const addressSnapshot = `${address.recipient_name} | ${address.phone} | ${address.label}: ${address.full_address}`;

    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.is_active) {
        const err = new Error(`Product "${item.name}" is no longer active.`);
        err.statusCode = 400;
        throw err;
      }
      subtotal += parseFloat(item.price) * item.quantity;
    }

    let deliveryFee = 0;
    if (deliveryMethod === 'instant') {
      deliveryFee = 25000.00;
    } else if (deliveryMethod === 'next_day') {
      deliveryFee = 15000.00;
    } else if (deliveryMethod === 'regular') {
      deliveryFee = 10000.00;
    }

    let discountAmount = 0.00;
    let voucherId = null;
    let promoId = null;

    if (discountCode) {

      const [vouchers] = await conn.query('SELECT * FROM vouchers WHERE code = ? FOR UPDATE', [discountCode]);
      if (vouchers.length > 0) {
        const v = vouchers[0];
        if (!v.is_active) {
          const err = new Error('Voucher is inactive.');
          err.statusCode = 400;
          throw err;
        }
        const now = new Date();
        if (now < new Date(v.valid_from) || now > new Date(v.valid_until)) {
          const err = new Error('Voucher has expired or is not active yet.');
          err.statusCode = 400;
          throw err;
        }
        if (v.used_count >= v.max_usage) {
          const err = new Error('Voucher usage limit reached.');
          err.statusCode = 400;
          throw err;
        }
        if (subtotal < parseFloat(v.min_purchase)) {
          const err = new Error(`Minimum purchase of ${v.min_purchase} is required for this voucher.`);
          err.statusCode = 400;
          throw err;
        }

        if (v.discount_type === 'fixed') {
          discountAmount = parseFloat(v.discount_value);
        } else {
          discountAmount = subtotal * (parseFloat(v.discount_value) / 100);
          if (v.max_discount) {
            discountAmount = Math.min(discountAmount, parseFloat(v.max_discount));
          }
        }
        discountAmount = Math.min(discountAmount, subtotal);
        voucherId = v.id;

        await conn.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [v.id]);

      } else {

        const [promos] = await conn.query('SELECT * FROM promos WHERE code = ? FOR UPDATE', [discountCode]);
        if (promos.length > 0) {
          const p = promos[0];
          if (!p.is_active) {
            const err = new Error('Promo is inactive.');
            err.statusCode = 400;
            throw err;
          }
          const now = new Date();
          if (now < new Date(p.valid_from) || now > new Date(p.valid_until)) {
            const err = new Error('Promo has expired or is not active yet.');
            err.statusCode = 400;
            throw err;
          }
          if (subtotal < parseFloat(p.min_purchase)) {
            const err = new Error(`Minimum purchase of ${p.min_purchase} is required for this promo.`);
            err.statusCode = 400;
            throw err;
          }

          if (p.discount_type === 'fixed') {
            discountAmount = parseFloat(p.discount_value);
          } else {
            discountAmount = subtotal * (parseFloat(p.discount_value) / 100);
            if (p.max_discount) {
              discountAmount = Math.min(discountAmount, parseFloat(p.max_discount));
            }
          }
          discountAmount = Math.min(discountAmount, subtotal);
          promoId = p.id;
        } else {
          const err = new Error('Invalid discount code.');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = parseFloat((taxableAmount * 0.12).toFixed(2));
    const total = subtotal - discountAmount + deliveryFee + taxAmount;

    const [wallets] = await conn.query(
      'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    let wallet;
    if (wallets.length === 0) {

      const [createResult] = await conn.query(
        'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
        [userId]
      );
      wallet = { id: createResult.insertId, balance: 0 };
    } else {
      wallet = wallets[0];
    }
    if (parseFloat(wallet.balance) < total) {
      const err = new Error(`Insufficient wallet balance. Total required is ${total}, but you only have ${wallet.balance}.`);
      err.statusCode = 400;
      throw err;
    }

    for (const item of cartItems) {
      const [prods] = await conn.query(
        'SELECT id, stock, name FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      const prod = prods[0];
      if (prod.stock < item.quantity) {
        const err = new Error(`Insufficient stock for product "${prod.name}". Available: ${prod.stock}, requested: ${item.quantity}.`);
        err.statusCode = 400;
        throw err;
      }
    }

    for (const item of cartItems) {
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    const newBalance = parseFloat(wallet.balance) - total;
    await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

    const [txResult] = await conn.query(
      `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, description)
       VALUES (?, ?, 'purchase', ?, ?, ?)`,
      [wallet.id, userId, total, newBalance, `Purchase for store order`]
    );
    const txId = txResult.insertId;

    const orderNumber = generateOrderNumber();
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, buyer_id, store_id, address_id, delivery_address_snapshot, 
                           delivery_method, status, subtotal, discount_amount, delivery_fee, tax_amount, total, voucher_id, promo_id)
       VALUES (?, ?, ?, ?, ?, ?, 'sedang_dikemas', ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, userId, storeId, addressId, addressSnapshot, deliveryMethod, subtotal, discountAmount, deliveryFee, taxAmount, total, voucherId, promoId]
    );
    const orderId = orderResult.insertId;

    await conn.query(
      'UPDATE wallet_transactions SET reference_id = ? WHERE id = ?',
      [orderId, txId]
    );

    for (const item of cartItems) {
      const itemSubtotal = parseFloat(item.price) * item.quantity;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity, itemSubtotal]
      );
    }

    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note)
       VALUES (?, 'sedang_dikemas', 'Order placed successfully. Payment completed using buyer wallet.')`,
      [orderId]
    );

    await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    await conn.query('UPDATE carts SET store_id = NULL WHERE id = ?', [cart.id]);

    await conn.commit();
    return {
      orderId,
      orderNumber,
      status: 'sedang_dikemas',
      total,
      walletBalanceAfter: newBalance,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * List orders for a buyer.
 */
const getOrdersForBuyer = async (userId) => {
  const [orders] = await pool.query(
    `SELECT o.*, s.store_name,
            (CASE WHEN sr.id IS NOT NULL THEN TRUE ELSE FALSE END) as is_reviewed
     FROM orders o
     JOIN stores s ON o.store_id = s.id
     LEFT JOIN store_reviews sr ON o.id = sr.order_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return orders;
};

/**
 * List incoming orders for a seller store.
 */
const getOrdersForSeller = async (userId) => {

  const [stores] = await pool.query('SELECT id FROM stores WHERE user_id = ?', [userId]);
  if (stores.length === 0) {
    return [];
  }
  const storeId = stores[0].id;

  const [orders] = await pool.query(
    `SELECT o.*, u.full_name as buyer_name 
     FROM orders o
     JOIN users u ON o.buyer_id = u.id
     WHERE o.store_id = ?
     ORDER BY o.created_at DESC`,
    [storeId]
  );
  return orders;
};

/**
 * Get order detail.
 */
const getOrderById = async (orderId, userId, activeRole) => {
  const [orders] = await pool.query(
    `SELECT o.*, s.store_name, u.full_name as buyer_name,
            (CASE WHEN sr.id IS NOT NULL THEN TRUE ELSE FALSE END) as is_reviewed
     FROM orders o
     JOIN stores s ON o.store_id = s.id
     JOIN users u ON o.buyer_id = u.id
     LEFT JOIN store_reviews sr ON o.id = sr.order_id
     WHERE o.id = ?`,
    [orderId]
  );

  if (orders.length === 0) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const order = orders[0];

  if (activeRole === 'buyer' && order.buyer_id !== userId) {
    const err = new Error('Access denied. You do not own this order.');
    err.statusCode = 403;
    throw err;
  }

  if (activeRole === 'seller') {
    const [stores] = await pool.query('SELECT id FROM stores WHERE user_id = ?', [userId]);
    if (stores.length === 0 || stores[0].id !== order.store_id) {
      const err = new Error('Access denied. This order belongs to another store.');
      err.statusCode = 403;
      throw err;
    }
  }

  if (activeRole === 'driver') {

    const [jobs] = await pool.query('SELECT driver_id FROM delivery_jobs WHERE order_id = ?', [orderId]);
    if (jobs.length > 0 && jobs[0].driver_id !== null && jobs[0].driver_id !== userId) {
      const err = new Error('Access denied. This job is taken by another driver.');
      err.statusCode = 403;
      throw err;
    }
  }

  const [items] = await pool.query(
    `SELECT oi.*, p.image_url 
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  const [history] = await pool.query(
    'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
    [orderId]
  );

  order.items = items;
  order.statusHistory = history;

  return order;
};

/**
 * Update order status with validation and history logging.
 */
const updateOrderStatus = async (orderId, userId, activeRole, { status, note }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) {
      const err = new Error('Order not found.');
      err.statusCode = 404;
      throw err;
    }
    const order = orders[0];

    if (activeRole === 'seller') {

      const [stores] = await conn.query('SELECT id FROM stores WHERE user_id = ?', [userId]);
      if (stores.length === 0 || stores[0].id !== order.store_id) {
        const err = new Error('Access denied. This order belongs to another store.');
        err.statusCode = 403;
        throw err;
      }

      if (order.status !== 'sedang_dikemas' || status !== 'menunggu_pengirim') {
        const err = new Error('Invalid status transition. Sellers can only mark packed orders as "menunggu_pengirim".');
        err.statusCode = 400;
        throw err;
      }
    } else if (activeRole === 'driver') {

    } else if (activeRole !== 'admin') {
      const err = new Error('Access denied.');
      err.statusCode = 403;
      throw err;
    }

    await conn.query(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    if (status === 'menunggu_pengirim') {
      await conn.query(
        'INSERT INTO delivery_jobs (order_id, status) VALUES (?, \'available\') ON DUPLICATE KEY UPDATE status = \'available\', driver_id = NULL',
        [orderId]
      );
    }

    await conn.query(
      'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
      [orderId, status, note || `Status updated to ${status}`]
    );

    await conn.commit();
    return { id: orderId, status };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  checkout,
  getOrdersForBuyer,
  getOrdersForSeller,
  getOrderById,
  updateOrderStatus,
};
