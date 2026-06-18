const pool = require('../config/database');

/**
 * Get all addresses for a user.
 */
const getAddressesByUserId = async (userId) => {
  const [addresses] = await pool.query(
    'SELECT * FROM delivery_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return addresses;
};

/**
 * Get address by ID.
 */
const getAddressById = async (id, userId) => {
  const [addresses] = await pool.query(
    'SELECT * FROM delivery_addresses WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return addresses[0] || null;
};

/**
 * Add a new delivery address.
 */
const createAddress = async (userId, { label, recipientName, phone, fullAddress, isDefault = false }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // If setting as default, unset other defaults
    if (isDefault) {
      await conn.query(
        'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    } else {
      // If user has no addresses yet, make this one default anyway
      const [existing] = await conn.query(
        'SELECT id FROM delivery_addresses WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (existing.length === 0) {
        isDefault = true;
      }
    }

    const [result] = await conn.query(
      `INSERT INTO delivery_addresses (user_id, label, recipient_name, phone, full_address, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, label, recipientName, phone, fullAddress, isDefault]
    );

    await conn.commit();
    return {
      id: result.insertId,
      userId,
      label,
      recipientName,
      phone,
      fullAddress,
      isDefault: !!isDefault,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Update an existing delivery address.
 */
const updateAddress = async (addressId, userId, { label, recipientName, phone, fullAddress, isDefault }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check ownership
    const [existing] = await conn.query(
      'SELECT id, is_default FROM delivery_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    if (existing.length === 0) {
      const err = new Error('Address not found.');
      err.statusCode = 404;
      throw err;
    }

    // Handle default address swapping
    if (isDefault && !existing[0].is_default) {
      await conn.query(
        'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    await conn.query(
      `UPDATE delivery_addresses 
       SET label = ?, recipient_name = ?, phone = ?, full_address = ?, is_default = ? 
       WHERE id = ? AND user_id = ?`,
      [label, recipientName, phone, fullAddress, isDefault, addressId, userId]
    );

    await conn.commit();
    return {
      id: addressId,
      userId,
      label,
      recipientName,
      phone,
      fullAddress,
      isDefault: !!isDefault,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Delete a delivery address.
 */
const deleteAddress = async (addressId, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check ownership
    const [existing] = await conn.query(
      'SELECT id, is_default FROM delivery_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    if (existing.length === 0) {
      const err = new Error('Address not found.');
      err.statusCode = 404;
      throw err;
    }

    // Delete
    await conn.query(
      'DELETE FROM delivery_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    // If deleted address was default, make another one default if exists
    if (existing[0].is_default) {
      const [others] = await conn.query(
        'SELECT id FROM delivery_addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (others.length > 0) {
        await conn.query(
          'UPDATE delivery_addresses SET is_default = TRUE WHERE id = ?',
          [others[0].id]
        );
      }
    }

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Set an address as default.
 */
const setDefaultAddress = async (addressId, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT id FROM delivery_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    if (existing.length === 0) {
      const err = new Error('Address not found.');
      err.statusCode = 404;
      throw err;
    }

    await conn.query(
      'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
      [userId]
    );

    await conn.query(
      'UPDATE delivery_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
