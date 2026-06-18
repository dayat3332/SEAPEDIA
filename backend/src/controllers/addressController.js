const addressService = require('../services/addressService');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddressesByUserId(req.user.id);
    res.json({ data: addresses });
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { label, recipientName, phone, fullAddress, isDefault } = req.body;
    const address = await addressService.createAddress(req.user.id, {
      label,
      recipientName,
      phone,
      fullAddress,
      isDefault: !!isDefault,
    });
    res.status(201).json({ message: 'Address added successfully.', data: address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { label, recipientName, phone, fullAddress, isDefault } = req.body;
    const address = await addressService.updateAddress(req.params.id, req.user.id, {
      label,
      recipientName,
      phone,
      fullAddress,
      isDefault: !!isDefault,
    });
    res.json({ message: 'Address updated successfully.', data: address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await addressService.deleteAddress(req.params.id, req.user.id);
    res.json({ message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    await addressService.setDefaultAddress(req.params.id, req.user.id);
    res.json({ message: 'Default address updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
