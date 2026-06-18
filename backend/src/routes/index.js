const router = require('express').Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const reviewRoutes = require('./reviewRoutes');
const storeRoutes = require('./storeRoutes');
const walletRoutes = require('./walletRoutes');
const addressRoutes = require('./addressRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const discountRoutes = require('./discountRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/stores', storeRoutes);
router.use('/wallet', walletRoutes);
router.use('/addresses', addressRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
