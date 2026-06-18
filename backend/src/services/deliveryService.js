const pool = require('../config/database');

/**
 * List available delivery jobs (status === 'available')
 */
const getAvailableJobs = async () => {
  const [jobs] = await pool.query(
    `SELECT dj.*, o.order_number, o.delivery_method, o.delivery_address_snapshot, o.delivery_fee, o.total, s.store_name 
     FROM delivery_jobs dj
     JOIN orders o ON dj.order_id = o.id
     JOIN stores s ON o.store_id = s.id
     WHERE dj.status = 'available'
     ORDER BY dj.created_at DESC`
  );
  return jobs;
};

/**
 * View delivery job details
 */
const getJobById = async (jobId, driverId) => {
  const [jobs] = await pool.query(
    `SELECT dj.*, o.order_number, o.delivery_method, o.delivery_address_snapshot, o.delivery_fee, o.total, s.store_name, u.full_name as buyer_name
     FROM delivery_jobs dj
     JOIN orders o ON dj.order_id = o.id
     JOIN stores s ON o.store_id = s.id
     JOIN users u ON o.buyer_id = u.id
     WHERE dj.id = ?`,
    [jobId]
  );
  if (jobs.length === 0) {
    const err = new Error('Job not found.');
    err.statusCode = 404;
    throw err;
  }
  const job = jobs[0];
  if (job.driver_id !== null && job.driver_id !== driverId) {
    const err = new Error('Access denied. Job is assigned to another driver.');
    err.statusCode = 403;
    throw err;
  }
  return job;
};

/**
 * Take an available delivery job
 */
const takeJob = async (jobId, driverId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify driver doesn't already have an active job
    const [activeJobs] = await conn.query(
      "SELECT id FROM delivery_jobs WHERE driver_id = ? AND status = 'picked_up'",
      [driverId]
    );
    if (activeJobs.length > 0) {
      const err = new Error('You already have an active delivery job. Complete it first.');
      err.statusCode = 400;
      throw err;
    }

    // Lock delivery job row
    const [jobs] = await conn.query(
      'SELECT * FROM delivery_jobs WHERE id = ? FOR UPDATE',
      [jobId]
    );
    if (jobs.length === 0) {
      const err = new Error('Job not found.');
      err.statusCode = 404;
      throw err;
    }
    const job = jobs[0];
    if (job.status !== 'available' || job.driver_id !== null) {
      const err = new Error('Job is no longer available.');
      err.statusCode = 400;
      throw err;
    }

    // Update job
    await conn.query(
      "UPDATE delivery_jobs SET driver_id = ?, status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP WHERE id = ?",
      [driverId, jobId]
    );

    // Update order
    await conn.query(
      "UPDATE orders SET status = 'sedang_dikirim', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [job.order_id]
    );

    // Record order history
    await conn.query(
      "INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'sedang_dikirim', 'Driver has picked up the order and is on the way.')",
      [job.order_id]
    );

    await conn.commit();
    return { id: jobId, status: 'picked_up' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Complete a delivery job and transfer earnings (80% of delivery fee)
 */
const completeJob = async (jobId, driverId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock delivery job row
    const [jobs] = await conn.query(
      'SELECT * FROM delivery_jobs WHERE id = ? AND driver_id = ? FOR UPDATE',
      [jobId, driverId]
    );
    if (jobs.length === 0) {
      const err = new Error('Job not found or not assigned to you.');
      err.statusCode = 404;
      throw err;
    }
    const job = jobs[0];
    if (job.status !== 'picked_up') {
      const err = new Error('Job is not in picked_up status.');
      err.statusCode = 400;
      throw err;
    }

    // Get order details
    const [orders] = await conn.query('SELECT order_number, delivery_fee FROM orders WHERE id = ?', [job.order_id]);
    if (orders.length === 0) {
      const err = new Error('Order not found.');
      err.statusCode = 404;
      throw err;
    }
    const order = orders[0];
    const deliveryFee = parseFloat(order.delivery_fee);
    const earning = parseFloat((deliveryFee * 0.80).toFixed(2)); // Driver gets 80%

    // Update delivery job
    await conn.query(
      "UPDATE delivery_jobs SET status = 'delivered', earning = ?, delivered_at = CURRENT_TIMESTAMP WHERE id = ?",
      [earning, jobId]
    );

    // Update order
    await conn.query(
      "UPDATE orders SET status = 'pesanan_selesai', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [job.order_id]
    );

    // Add earning to driver's wallet
    let [wallets] = await conn.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [driverId]);
    let walletId;
    let newBalance;
    if (wallets.length === 0) {
      const [wResult] = await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [driverId, earning]);
      walletId = wResult.insertId;
      newBalance = earning;
    } else {
      const wallet = wallets[0];
      walletId = wallet.id;
      newBalance = parseFloat(wallet.balance) + earning;
      await conn.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, walletId]);
    }

    // Log wallet transaction
    await conn.query(
      `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, description, reference_id)
       VALUES (?, ?, 'earning', ?, ?, ?, ?)`,
      [walletId, driverId, earning, newBalance, `Earning from delivery job for order ${order.order_number}`, job.order_id]
    );

    // Record order status history
    await conn.query(
      "INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pesanan_selesai', 'Driver completed the delivery.')",
      [job.order_id]
    );

    await conn.commit();
    return { id: jobId, status: 'delivered', earning };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Get driver statistics and lists (active job, historical jobs)
 */
const getDriverStatsAndJobs = async (driverId) => {
  // Get wallet balance
  const [wallets] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [driverId]);
  const balance = wallets.length > 0 ? parseFloat(wallets[0].balance) : 0.00;

  // Get active job
  const [activeJobs] = await pool.query(
    `SELECT dj.*, o.order_number, o.delivery_method, o.delivery_address_snapshot, o.delivery_fee, o.total, s.store_name, u.full_name as buyer_name
     FROM delivery_jobs dj
     JOIN orders o ON dj.order_id = o.id
     JOIN stores s ON o.store_id = s.id
     JOIN users u ON o.buyer_id = u.id
     WHERE dj.driver_id = ? AND dj.status = 'picked_up'`,
    [driverId]
  );
  const activeJob = activeJobs.length > 0 ? activeJobs[0] : null;

  // Get job history
  const [history] = await pool.query(
    `SELECT dj.*, o.order_number, o.delivery_method, o.delivery_address_snapshot, o.delivery_fee, o.total, s.store_name, u.full_name as buyer_name
     FROM delivery_jobs dj
     JOIN orders o ON dj.order_id = o.id
     JOIN stores s ON o.store_id = s.id
     JOIN users u ON o.buyer_id = u.id
     WHERE dj.driver_id = ? AND dj.status != 'picked_up'
     ORDER BY dj.delivered_at DESC, dj.created_at DESC`,
    [driverId]
  );

  return {
    balance,
    activeJob,
    history
  };
};

module.exports = {
  getAvailableJobs,
  getJobById,
  takeJob,
  completeJob,
  getDriverStatsAndJobs
};
