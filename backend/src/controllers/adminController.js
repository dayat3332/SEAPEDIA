const adminService = require('../services/adminService');

const getMetrics = async (req, res, next) => {
  try {
    const data = await adminService.getMetrics();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const data = await adminService.getAllUsers();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const getSystemLogs = async (req, res, next) => {
  try {
    const data = await adminService.getSystemLogs();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const simulateNextDay = async (req, res, next) => {
  try {
    const days = parseInt(req.body.days, 10) || 1;
    const result = await adminService.simulateNextDay(days);
    res.json({ message: `Simulated shifting time forward by ${days} day(s) and processed overdue orders.`, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMetrics,
  getAllUsers,
  getSystemLogs,
  simulateNextDay
};
