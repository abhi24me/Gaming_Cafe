const User = require('../models/User');
const TopUpRequest = require('../models/TopUpRequest');
const Transaction = require('../models/Transaction'); // Needed for history

// @desc    User submits a top-up request
// @route   POST /api/wallet/request-topup
// @access  Private
exports.submitTopUpRequest = async (req, res) => {
  const { amount, upiTransactionId, receiptImageUrl } = req.body; // Assuming receiptImageUrl for now
  const userId = req.user.id; // From 'protect' middleware

  try {
    if (!amount || !upiTransactionId || !receiptImageUrl) {
      return res.status(400).json({ message: 'Amount, UPI Transaction ID, and Receipt Image URL are required.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount specified.' });
    }

    // --- WITH MULTER, receiptImageUrl would come from req.file ---
    // if (!req.file) {
    //   return res.status(400).json({ message: 'Receipt image is required.' });
    // }
    // const actualReceiptImageUrl = req.file.path; // Or URL if uploaded to cloud storage

    const newTopUpRequest = new TopUpRequest({
      user: userId,
      amount: numericAmount,
      upiTransactionId,
      receiptImageUrl: receiptImageUrl, // Replace with actualReceiptImageUrl when using multer
      status: 'pending',
      requestedAt: new Date()
    });

    await newTopUpRequest.save();

    res.status(201).json({
      message: 'Top-up request submitted successfully. It will be reviewed by an admin.',
      request: newTopUpRequest
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Submit TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while submitting top-up request.' });
  }
};

// @desc    Get current user's wallet balance
// @route   GET /api/wallet/balance
// @access  Private
exports.getWalletBalance = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
      gamerTag: user.gamerTag,
      walletBalance: user.walletBalance,
      loyaltyPoints: user.loyaltyPoints
    });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    res.status(500).json({ message: 'Server error while fetching wallet balance.' });
  }
};

// @desc    Get current user's transaction history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ timestamp: -1 }); // Newest first
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get Transaction History Error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction history.' });
  }
};

// @desc    Get current user's top-up request history
// @route   GET /api/wallet/topup-requests
// @access  Private
exports.getUserTopUpRequests = async (req, res) => {
  try {
    const topUpRequests = await TopUpRequest.find({ user: req.user.id }).sort({ requestedAt: -1 });
    res.status(200).json(topUpRequests);
  } catch (error) {
    console.error('Get User TopUp Requests Error:', error);
    res.status(500).json({ message: 'Server error while fetching top-up requests.' });
  }
};

// @desc    Get current wallet balance and loyalty points for logged-in user
// @route   GET /api/wallet/details
// @access  Private
exports.getWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance loyaltyPoints');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      balance: user.walletBalance,
      loyaltyPoints: user.loyaltyPoints
    });
  } catch (error) {
    console.error('Get Wallet Details Error:', error);
    res.status(500).json({ message: 'Server error while fetching wallet details.' });
  }
};