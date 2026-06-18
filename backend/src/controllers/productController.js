const productService = require('../services/productService');
const fs = require('fs');
const path = require('path');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = req.query.search || '';
    const storeId = req.query.store_id || null;
    const result = await productService.getProducts({ page, limit, search, storeId });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

const storeService = require('../services/storeService');

const getSellerProducts = async (req, res, next) => {
  try {
    const store = await storeService.getStoreByUserId(req.user.id);
    if (!store) {
      return res.status(400).json({ message: 'Please create a store first.' });
    }
    const products = await productService.getProductsByStoreId(store.id);
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const store = await storeService.getStoreByUserId(req.user.id);
    if (!store) {
      return res.status(400).json({ message: 'Please create a store first.' });
    }
    const { name, description, price, stock } = req.body;
    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await productService.createProduct({
      storeId: store.id,
      name,
      description,
      price,
      stock,
      imageUrl,
    });
    res.status(201).json({ message: 'Product created successfully.', data: product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const store = await storeService.getStoreByUserId(req.user.id);
    if (!store) {
      return res.status(400).json({ message: 'Please create a store first.' });
    }
    const { name, description, price, stock, isActive } = req.body;
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await productService.updateProduct(req.params.id, store.id, {
      name,
      description,
      price,
      stock,
      imageUrl,
      isActive: isActive === 'true' || isActive === true,
    });
    res.json({ message: 'Product updated successfully.', data: product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const store = await storeService.getStoreByUserId(req.user.id);
    if (!store) {
      return res.status(400).json({ message: 'Please create a store first.' });
    }
    await productService.deleteProduct(req.params.id, store.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
