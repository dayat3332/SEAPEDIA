const walletService = require('../services/walletService');

const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);
    const transactions = await walletService.getTransactionHistory(req.user.id);
    res.json({
      data: {
        balance: wallet ? wallet.balance : 0,
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

const topup = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await walletService.topupWallet(req.user.id, amount);
    res.json({
      message: 'Top-up successful.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWallet,
  topup,
};
