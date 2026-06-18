const discountService = require('../services/discountService');

const createVoucher = async (req, res, next) => {
  try {
    const result = await discountService.createVoucher(req.body);
    res.status(201).json({ message: 'Voucher created successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

const createPromo = async (req, res, next) => {
  try {
    const result = await discountService.createPromo(req.body);
    res.status(201).json({ message: 'Promo created successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

const getVouchers = async (req, res, next) => {
  try {
    const vouchers = await discountService.getVouchers();
    res.json({ data: vouchers });
  } catch (err) {
    next(err);
  }
};

const getPromos = async (req, res, next) => {
  try {
    const promos = await discountService.getPromos();
    res.json({ data: promos });
  } catch (err) {
    next(err);
  }
};

const validateDiscount = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Discount code is required.' });
    }
    if (subtotal === undefined || subtotal === null) {
      return res.status(400).json({ message: 'Subtotal is required for validation.' });
    }

    const result = await discountService.validateDiscountCode(code, subtotal);
    res.json({ message: 'Code validated successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVoucher,
  createPromo,
  getVouchers,
  getPromos,
  validateDiscount
};
