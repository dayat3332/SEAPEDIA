const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { username, email, phone, password, fullName, roles } = req.body;
    const user = await authService.register({ username, email, phone, password, fullName, roles });
    res.status(201).json({
      message: 'Pendaftaran berhasil. Silakan cek email Anda untuk kode verifikasi OTP.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const result = await authService.verifyEmail({ email, otpCode });
    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOTP({ email });
    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });
    res.json({ message: 'Login successful.', data: result });
  } catch (err) {
    next(err);
  }
};

const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const result = await authService.selectRole(req.user.id, role);
    res.json({ message: `Active role set to ${role}.`, data: result });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyEmail, resendOTP, login, selectRole, getProfile };
