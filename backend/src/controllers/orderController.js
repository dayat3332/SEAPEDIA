const orderService = require('../services/orderService');

const checkout = async (req, res, next) => {
  try {
    const { addressId, deliveryMethod, discountCode } = req.body;
    const result = await orderService.checkout(req.user.id, {
      addressId: parseInt(addressId, 10),
      deliveryMethod,
      discountCode,
    });
    res.json({ message: 'Checkout successful.', data: result });
  } catch (err) {
    next(err);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersForBuyer(req.user.id);
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrdersForSeller(req.user.id);
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      parseInt(req.params.id, 10),
      req.user.id,
      req.user.activeRole
    );
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const result = await orderService.updateOrderStatus(
      parseInt(req.params.id, 10),
      req.user.id,
      req.user.activeRole,
      { status, note }
    );
    res.json({ message: 'Order status updated successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout,
  getBuyerOrders,
  getSellerOrders,
  getOrderDetail,
  updateStatus,
};
