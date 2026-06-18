const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Admin only: Create voucher and promo resources
router.post('/vouchers', auth, roleGuard(['admin']), discountController.createVoucher);
router.post('/promos', auth, roleGuard(['admin']), discountController.createPromo);

// Authenticated users: List available vouchers & promos
router.get('/vouchers', auth, discountController.getVouchers);
router.get('/promos', auth, discountController.getPromos);

// Authenticated buyers: Validate discount code against subtotal
router.post('/validate', auth, roleGuard(['buyer']), discountController.validateDiscount);

module.exports = router;
