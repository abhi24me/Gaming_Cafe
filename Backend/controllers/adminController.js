
const TopUpRequest = require('../models/TopUpRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Admin = require('../models/Admin'); // For admin login
const jwt = require('jsonwebtoken');   // For generating admin token
const mongoose = require('mongoose');

// Helper function to generate Admin JWT
const generateAdminToken = (adminId, username) => {
  return jwt.sign(
    { id: adminId, username: username, type: 'admin' }, // Added type claim
    process.env.JWT_SECRET, // Consider JWT_ADMIN_SECRET
    { expiresIn: '12h' }
  );
};

// @desc    Authenticate admin & get token
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide admin username and password' });
    }

    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials (admin not found)' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials (password incorrect)' });
    }

    const token = generateAdminToken(admin._id, admin.username);
    res.status(200).json({
      message: "Admin login successful",
      token,
      admin: { id: admin._id, username: admin.username }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};


// @desc    Admin gets a list of all pending top-up requests
// @route   GET /api/admin/topup-requests/pending
// @access  Admin (Protected by protectAdmin)
exports.getPendingTopUpRequests = async (req, res) => {
  try {
    const pendingRequests = await TopUpRequest.find({ status: 'pending' })
      .populate('user', 'gamerTag email walletBalance') // Populate relevant user details
      .sort({ requestedAt: 1 }); // Oldest first
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Get Pending TopUp Requests Error:', error);
    res.status(500).json({ message: 'Server error while fetching pending requests.' });
  }
};

// @desc    Admin approves a top-up request
// @route   PUT /api/admin/topup-requests/:requestId/approve
// @access  Admin (Protected by protectAdmin)
exports.approveTopUpRequest = async (req, res) => {
  const { requestId } = req.params;
  const adminId = req.admin.id; // Admin performing the action, from protectAdmin middleware

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid request ID format.' });
    }

    const topUpRequest = await TopUpRequest.findById(requestId).session(session);

    if (!topUpRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Top-up request not found.' });
    }
    if (topUpRequest.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Request already ${topUpRequest.status}.` });
    }

    const userToCredit = await User.findById(topUpRequest.user).session(session);
    if (!userToCredit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User associated with the request not found.' });
    }

    const walletBalanceBefore = userToCredit.walletBalance;
    const loyaltyPointsBalanceBefore = userToCredit.loyaltyPoints;

    userToCredit.walletBalance += topUpRequest.amount;
    await userToCredit.save({ session });

    const newTransaction = new Transaction({
      user: userToCredit._id,
      type: 'top-up',
      amount: topUpRequest.amount,
      description: `Wallet top-up approved (Request ID: ${topUpRequest._id.toString().slice(-6)})`,
      relatedTopUpRequest: topUpRequest._id,
      walletBalanceBefore: walletBalanceBefore,
      walletBalanceAfter: userToCredit.walletBalance,
      loyaltyPointsChange: 0,
      loyaltyPointsBalanceBefore: loyaltyPointsBalanceBefore,
      loyaltyPointsBalanceAfter: userToCredit.loyaltyPoints,
      performedBy: adminId,
      timestamp: new Date()
    });
    await newTransaction.save({ session });

    topUpRequest.status = 'approved';
    topUpRequest.reviewedBy = adminId;
    topUpRequest.reviewedAt = new Date();
    topUpRequest.relatedTransaction = newTransaction._id;
    await topUpRequest.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
        message: 'Top-up request approved successfully.',
        request: await TopUpRequest.findById(requestId).populate('user', 'gamerTag email') // Send back populated request
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Approve TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while approving request.' });
  }
};

// @desc    Admin rejects a top-up request
// @route   PUT /api/admin/topup-requests/:requestId/reject
// @access  Admin (Protected by protectAdmin)
exports.rejectTopUpRequest = async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;
  const adminId = req.admin.id; // Admin performing the action

  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: 'Invalid request ID format.' });
    }
    const topUpRequest = await TopUpRequest.findById(requestId);

    if (!topUpRequest) {
      return res.status(404).json({ message: 'Top-up request not found.' });
    }
    if (topUpRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${topUpRequest.status}.` });
    }

    topUpRequest.status = 'rejected';
    topUpRequest.reviewedBy = adminId;
    topUpRequest.reviewedAt = new Date();
    if (adminNotes) {
      topUpRequest.adminNotes = adminNotes;
    }
    await topUpRequest.save();

    res.status(200).json({
        message: 'Top-up request rejected.',
        request: await TopUpRequest.findById(requestId).populate('user', 'gamerTag email') // Send back populated request
    });

  } catch (error) {
    console.error('Reject TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while rejecting request.' });
  }
};
