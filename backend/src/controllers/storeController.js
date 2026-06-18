const storeService = require('../services/storeService');

const getMyStore = async (req, res, next) => {
  try {
    const store = await storeService.getStoreByUserId(req.user.id);
    if (!store) {
      return res.status(200).json({ data: null, message: 'No store created yet.' });
    }
    res.json({ data: store });
  } catch (err) {
    next(err);
  }
};

const createStore = async (req, res, next) => {
  try {
    const { storeName, description, imageUrl } = req.body;
    const store = await storeService.createStore({
      userId: req.user.id,
      storeName,
      description,
      imageUrl,
    });
    res.status(201).json({ message: 'Store created successfully.', data: store });
  } catch (err) {
    next(err);
  }
};

const updateStore = async (req, res, next) => {
  try {
    const { storeName, description, imageUrl } = req.body;
    const store = await storeService.updateStore(req.user.id, {
      storeName,
      description,
      imageUrl,
    });
    res.json({ message: 'Store updated successfully.', data: store });
  } catch (err) {
    next(err);
  }
};

const getStoreSummary = async (req, res, next) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }
    res.json({ data: store });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyStore,
  createStore,
  updateStore,
  getStoreSummary,
};
