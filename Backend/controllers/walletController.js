
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TopUpRequest = require('../models/TopUpRequest');
const mongoose = require('mongoose');

exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch confirmed transactions
    const confirmedTransactions = await Transaction.find({ user: userId })
      .select('-receiptData') // Exclude receipt data from confirmed transactions
      .lean(); // Use lean for performance if not modifying

    // Fetch pending and rejected top-up requests
    const userTopUpRequests = await TopUpRequest.find({
      user: userId,
      status: { $in: ['pending', 'rejected'] }
    })
    .select('-receiptData') // Exclude receipt data
    .lean();

    // Transform TopUpRequests to a Transaction-like structure
    const transformedRequests = userTopUpRequests.map(req => ({
      _id: req._id.toString(), // Ensure _id is a string like other transactions
      type: 'topup-request', // Differentiate this type
      amount: req.amount,
      description: `Top-Up Request (Status: ${req.status})${req.status === 'rejected' && req.adminNotes ? ` - Reason: ${req.adminNotes}` : ''}`,
      timestamp: req.requestedAt.toISOString(), // Use requestedAt as the primary timestamp
      status: req.status, // 'pending' or 'rejected'
      adminNotes: req.adminNotes, // Include admin notes if present
      user: req.user, // Keep user reference if needed, or simplify
    }));

    // Combine and sort all items
    const allItems = [...confirmedTransactions, ...transformedRequests];
    allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json(allItems);
  } catch (error) {
    console.error('Get Wallet Transactions Error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions.' });
  }
};

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
  } catch (error)
  {
    console.error('Get Wallet Details Error:', error);
    res.status(500).json({ message: 'Server error while fetching wallet details.' });
  }
};

exports.requestTopUp = async (req, res) => {
  const { amount, paymentMethod } = req.body; // transactionId (UPI ID) is removed
  const userId = req.user.id;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Payment receipt image is required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'Invalid top-up amount.' });
  }

  try {
    const newTopUpRequest = new TopUpRequest({
      user: userId,
      amount: numericAmount,
      paymentMethod: paymentMethod || 'UPI',
      receiptData: req.file.buffer, // Store the image buffer
      receiptMimeType: req.file.mimetype, // Store the image MIME type
      // upiTransactionId removed
      // receiptImageUrl and receiptFilename removed
      status: 'pending',
      requestedAt: new Date()
    });

    await newTopUpRequest.save();

    res.status(201).json({
      message: 'Top-up request submitted successfully. It will be reviewed by an admin.',
      request: { // Send back limited request info, not the image data
        _id: newTopUpRequest._id,
        amount: newTopUpRequest.amount,
        status: newTopUpRequest.status,
        requestedAt: newTopUpRequest.requestedAt
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Request Top-Up Error:', error);
    res.status(500).json({ message: 'Server error while submitting top-up request.' });
  }
};

