const pool = require('../config/database');

/**
 * Get system metrics
 */
const getMetrics = async () => {
  const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
  const [[{ storeCount }]] = await pool.query('SELECT COUNT(*) as storeCount FROM stores');
  const [[{ productCount }]] = await pool.query('SELECT COUNT(*) as productCount FROM products');
  const [[{ orderCount, totalSales }]] = await pool.query('SELECT COUNT(*) as orderCount, COALESCE(SUM(total), 0) as totalSales FROM orders');

  const [[{ overdueCount }]] = await pool.query(
    `SELECT COUNT(*) as overdueCount 
     FROM orders 
     WHERE status IN ('sedang_dikemas', 'menunggu_pengirim', 'sedang_dikirim')
       AND (
         (delivery_method = 'instant' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 2) OR
         (delivery_method = 'next_day' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24) OR
         (delivery_method = 'regular' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 72)
       )`
  );

  return {
    userCount,
    storeCount,
    productCount,
    orderCount,
    totalSales: parseFloat(totalSales),
    overdueCount
  };
};

/**
 * Get all users with their roles
 */
const getAllUsers = async () => {
  const [users] = await pool.query(
    `SELECT u.id, u.username, u.email, u.phone, u.full_name, u.created_at, GROUP_CONCAT(ur.role) as roles 
     FROM users u 
     LEFT JOIN user_roles ur ON u.id = ur.user_id 
     GROUP BY u.id 
     ORDER BY u.created_at DESC`
  );
  
  // Format roles into arrays
  return users.map(u => ({
    ...u,
    roles: u.roles ? u.roles.split(',') : []
  }));
};

/**
 * Get recent system status logs (order transactions and transitions)
 */
const getSystemLogs = async () => {
  const [logs] = await pool.query(
    `SELECT osh.*, o.order_number 
     FROM order_status_history osh 
     JOIN orders o ON osh.order_id = o.id 
     ORDER BY osh.created_at DESC 
     LIMIT 50`
  );
  return logs;
};

/**
 * Simulate shifting order creation timestamps to trigger delivery SLA overdue handling
 */
const simulateNextDay = async (days = 1) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Shift active orders' created_at back by days
    await conn.query(
      `UPDATE orders 
       SET created_at = DATE_SUB(created_at, INTERVAL ? DAY) 
       WHERE status IN ('sedang_dikemas', 'menunggu_pengirim', 'sedang_dikirim')`,
      [days]
    );

    // 2. Identify overdue orders based on SLA:
    // - Instant: >= 2 hours
    // - Next Day: >= 24 hours
    // - Regular: >= 72 hours
    const [overdueOrders] = await conn.query(
      `SELECT o.*, u.id as buyer_user_id 
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.status IN ('sedang_dikemas', 'menunggu_pengirim', 'sedang_dikirim')
         AND (
           (o.delivery_method = 'instant' AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 2) OR
           (o.delivery_method = 'next_day' AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 24) OR
           (o.delivery_method = 'regular' AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 72)
         ) FOR UPDATE`
    );

    const processed = [];

    // 3. Process refunds and stock/income reversal for each overdue order
    for (const order of overdueOrders) {
      const orderId = order.id;

      // Update order status to 'dikembalikan'
      await conn.query(
        "UPDATE orders SET status = 'dikembalikan', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [orderId]
      );

      // Record order history
      await conn.query(
        `INSERT INTO order_status_history (order_id, status, note) 
         VALUES (?, 'dikembalikan', 'Order auto-returned: Exceeded delivery SLA limit.')`,
        [orderId]
      );

      // Update delivery job status if exists
      await conn.query(
        "UPDATE delivery_jobs SET status = 'returned' WHERE order_id = ?",
        [orderId]
      );

      // Refund Buyer Wallet
      const refundAmount = parseFloat(order.total);
      
      // Get or create wallet
      let [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [order.buyer_id]);
      let walletId;
      let newBalance;
      if (wallets.length === 0) {
        const [wResult] = await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [order.buyer_id, refundAmount]);
        walletId = wResult.insertId;
        newBalance = refundAmount;
      } else {
        const wallet = wallets[0];
        walletId = wallet.id;
        newBalance = parseFloat(wallet.balance) + refundAmount;
        await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, walletId]);
      }

      // Log wallet transaction
      await conn.query(
        `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, description, reference_id)
         VALUES (?, ?, 'refund', ?, ?, ?, ?)`,
        [walletId, order.buyer_id, refundAmount, newBalance, `Auto-refund for overdue order ${order.order_number}`, orderId]
      );

      // Restore product stock
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await conn.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      processed.push({
        order_number: order.order_number,
        total: order.total,
        delivery_method: order.delivery_method
      });
    }

    await conn.commit();
    return {
      shiftedDays: days,
      refundedOrdersCount: processed.length,
      refundedOrders: processed
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getMetrics,
  getAllUsers,
  getSystemLogs,
  simulateNextDay
};
