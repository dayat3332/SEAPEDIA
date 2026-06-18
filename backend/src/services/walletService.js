const pool = require('../config/database');

/**
 * Get user wallet details.
 */
const getWalletByUserId = async (userId) => {
  const [wallets] = await pool.query(
    'SELECT * FROM wallets WHERE user_id = ?',
    [userId]
  );
  return wallets[0] || null;
};

/**
 * Get wallet transaction history.
 */
const getTransactionHistory = async (userId) => {
  const [txs] = await pool.query(
    `SELECT wt.* FROM wallet_transactions wt
     JOIN wallets w ON wt.wallet_id = w.id
     WHERE w.user_id = ?
     ORDER BY wt.created_at DESC`,
    [userId]
  );
  return txs;
};

/**
 * Simulate top-up for a buyer.
 */
const topupWallet = async (userId, amount) => {
  if (amount <= 0) {
    const err = new Error('Top-up amount must be greater than 0.');
    err.statusCode = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get wallet (locking row)
    const [wallets] = await conn.query(
      'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    let wallet;
    if (wallets.length === 0) {
      // Auto-create wallet for users who don't have one yet
      const [createResult] = await conn.query(
        'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
        [userId]
      );
      wallet = { id: createResult.insertId, balance: 0 };
    } else {
      wallet = wallets[0];
    }
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

    // Update balance
    await conn.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, wallet.id]
    );

    // Insert transaction record
    await conn.query(
      `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_after, description)
       VALUES (?, ?, 'topup', ?, ?, 'Simulated wallet top-up')`,
      [wallet.id, userId, amount, newBalance]
    );

    await conn.commit();
    return { balance: newBalance };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getWalletByUserId,
  getTransactionHistory,
  topupWallet,
};
