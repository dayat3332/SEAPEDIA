const pool = require('../config/database');

/**
 * Create a new voucher (Admin only)
 */
const createVoucher = async (data) => {
  const { code, discountType, discountValue, minPurchase, maxDiscount, maxUsage, validFrom, validUntil } = data;
  const [result] = await pool.query(
    `INSERT INTO vouchers 
      (code, discount_type, discount_value, min_purchase, max_discount, max_usage, valid_from, valid_until) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, discountType, discountValue, minPurchase || 0, maxDiscount || null, maxUsage, validFrom, validUntil]
  );
  return { id: result.insertId, code, discountType, discountValue };
};

/**
 * Create a new promo (Admin only)
 */
const createPromo = async (data) => {
  const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil } = data;
  const [result] = await pool.query(
    `INSERT INTO promos 
      (code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, discountType, discountValue, minPurchase || 0, maxDiscount || null, validFrom, validUntil]
  );
  return { id: result.insertId, code, discountType, discountValue };
};

/**
 * List all vouchers
 */
const getVouchers = async () => {
  const [vouchers] = await pool.query('SELECT * FROM vouchers ORDER BY created_at DESC');
  return vouchers;
};

/**
 * List all promos
 */
const getPromos = async () => {
  const [promos] = await pool.query('SELECT * FROM promos ORDER BY created_at DESC');
  return promos;
};

/**
 * Validate a discount code (either voucher or promo) against a purchase subtotal
 */
const validateDiscountCode = async (code, subtotal) => {
  const now = new Date();

  // 1. Check Vouchers
  const [vouchers] = await pool.query('SELECT * FROM vouchers WHERE code = ?', [code]);
  if (vouchers.length > 0) {
    const v = vouchers[0];
    if (!v.is_active) {
      const err = new Error('Voucher is inactive.');
      err.statusCode = 400;
      throw err;
    }
    const from = new Date(v.valid_from);
    const until = new Date(v.valid_until);
    if (now < from || now > until) {
      const err = new Error('Voucher is expired or not valid yet.');
      err.statusCode = 400;
      throw err;
    }
    if (v.used_count >= v.max_usage) {
      const err = new Error('Voucher usage limit has been reached.');
      err.statusCode = 400;
      throw err;
    }
    if (parseFloat(subtotal) < parseFloat(v.min_purchase)) {
      const err = new Error(`Minimum purchase of ${v.min_purchase} is required for this voucher.`);
      err.statusCode = 400;
      throw err;
    }

    let discount = 0;
    if (v.discount_type === 'fixed') {
      discount = parseFloat(v.discount_value);
    } else {
      discount = parseFloat(subtotal) * (parseFloat(v.discount_value) / 100);
      if (v.max_discount) {
        discount = Math.min(discount, parseFloat(v.max_discount));
      }
    }
    discount = Math.min(discount, parseFloat(subtotal));

    return {
      type: 'voucher',
      id: v.id,
      code: v.code,
      discountType: v.discount_type,
      discountValue: v.discount_value,
      discountAmount: discount
    };
  }

  // 2. Check Promos
  const [promos] = await pool.query('SELECT * FROM promos WHERE code = ?', [code]);
  if (promos.length > 0) {
    const p = promos[0];
    if (!p.is_active) {
      const err = new Error('Promo is inactive.');
      err.statusCode = 400;
      throw err;
    }
    const from = new Date(p.valid_from);
    const until = new Date(p.valid_until);
    if (now < from || now > until) {
      const err = new Error('Promo is expired or not valid yet.');
      err.statusCode = 400;
      throw err;
    }
    if (parseFloat(subtotal) < parseFloat(p.min_purchase)) {
      const err = new Error(`Minimum purchase of ${p.min_purchase} is required for this promo.`);
      err.statusCode = 400;
      throw err;
    }

    let discount = 0;
    if (p.discount_type === 'fixed') {
      discount = parseFloat(p.discount_value);
    } else {
      discount = parseFloat(subtotal) * (parseFloat(p.discount_value) / 100);
      if (p.max_discount) {
        discount = Math.min(discount, parseFloat(p.max_discount));
      }
    }
    discount = Math.min(discount, parseFloat(subtotal));

    return {
      type: 'promo',
      id: p.id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      discountAmount: discount
    };
  }

  const err = new Error('Invalid discount code.');
  err.statusCode = 400;
  throw err;
};

module.exports = {
  createVoucher,
  createPromo,
  getVouchers,
  getPromos,
  validateDiscountCode
};
