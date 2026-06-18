const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const deliveryController = require('../controllers/deliveryController');

router.use(auth);

// Driver dashboard stats and taken jobs
router.get('/dashboard', roleGuard('driver'), deliveryController.getDriverDashboard);

// Find available delivery jobs
router.get('/available', roleGuard('driver'), deliveryController.getAvailableJobs);

// View delivery job detail
router.get('/:id', roleGuard('driver'), deliveryController.getJobDetail);

// Take an available job
router.post('/:id/take', roleGuard('driver'), deliveryController.takeJob);

// Confirm completed job
router.post('/:id/complete', roleGuard('driver'), deliveryController.completeJob);

module.exports = router;
