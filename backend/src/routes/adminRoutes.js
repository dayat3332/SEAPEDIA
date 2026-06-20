const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const adminController = require('../controllers/adminController');

router.use(auth);
router.use(roleGuard('admin'));

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getAllUsers);
router.get('/logs', adminController.getSystemLogs);
router.post('/simulate-next-day', adminController.simulateNextDay);
router.delete('/users/:id', adminController.deleteUser);

const storeReviewController = require('../controllers/storeReviewController');
router.get('/store-reviews', storeReviewController.getAllStoreReviews);
router.delete('/store-reviews/:id', storeReviewController.deleteStoreReview);

module.exports = router;
