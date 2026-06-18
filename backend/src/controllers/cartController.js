const cartService = require('../services/cartService');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCartDetails(req.user.id);
    res.json({ data: cart });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItemToCart(req.user.id, {
      productId: parseInt(productId, 10),
      quantity: parseInt(quantity, 10) || 1,
    });
    res.json({ message: 'Product added to cart successfully.', data: cart });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateItemQuantity(
      req.user.id,
      parseInt(req.params.productId, 10),
      parseInt(quantity, 10)
    );
    res.json({ message: 'Cart quantity updated successfully.', data: cart });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItemFromCart(
      req.user.id,
      parseInt(req.params.productId, 10)
    );
    res.json({ message: 'Product removed from cart successfully.', data: cart });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    res.json({ message: 'Cart cleared successfully.', data: cart });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
