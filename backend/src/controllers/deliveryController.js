const deliveryService = require('../services/deliveryService');

const getAvailableJobs = async (req, res, next) => {
  try {
    const jobs = await deliveryService.getAvailableJobs();
    res.json({ data: jobs });
  } catch (err) {
    next(err);
  }
};

const getJobDetail = async (req, res, next) => {
  try {
    const job = await deliveryService.getJobById(parseInt(req.params.id, 10), req.user.id);
    res.json({ data: job });
  } catch (err) {
    next(err);
  }
};

const takeJob = async (req, res, next) => {
  try {
    const result = await deliveryService.takeJob(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Delivery job taken successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

const completeJob = async (req, res, next) => {
  try {
    const result = await deliveryService.completeJob(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Delivery completed successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

const getDriverDashboard = async (req, res, next) => {
  try {
    const dashboardData = await deliveryService.getDriverStatsAndJobs(req.user.id);
    res.json({ data: dashboardData });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailableJobs,
  getJobDetail,
  takeJob,
  completeJob,
  getDriverDashboard
};
