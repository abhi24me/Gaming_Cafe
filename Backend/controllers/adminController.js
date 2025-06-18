
const TopUpRequest = require('../models/TopUpRequest');
const User = require('../models/User'); // Needed for user search in history
const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction'); // Added this line
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateAdminToken = (adminId, username) => {
  return jwt.sign(
    { id: adminId, username: username, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
};

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

exports.getPendingTopUpRequests = async (req, res) => {
  try {
    const pendingRequests = await TopUpRequest.find({ status: 'pending' })
      .populate('user', 'gamerTag email walletBalance')
      .populate('reviewedBy', 'username')
      .sort({ requestedAt: 1 });
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Get Pending TopUp Requests Error:', error);
    res.status(500).json({ message: 'Server error while fetching pending requests.' });
  }
};

exports.getTopUpRequestHistory = async (req, res) => {
  try {
    const { startDate, endDate, adminUsername, userSearch } = req.query;
    let pipeline = [];

    // Match stage for base query conditions (if any specific, otherwise it starts broad)
    let initialMatchConditions = {}; // Add any base conditions here if needed

    // Date filtering on 'requestedAt'
    if (startDate) {
      initialMatchConditions.requestedAt = { ...initialMatchConditions.requestedAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      // Adjust endDate to include the entire day
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      initialMatchConditions.requestedAt = { ...initialMatchConditions.requestedAt, $lte: endOfDay };
    }
    if(Object.keys(initialMatchConditions).length > 0){
        pipeline.push({ $match: initialMatchConditions });
    }


    // Lookup user details
    pipeline.push({
      $lookup: {
        from: 'users', // The actual collection name for User model
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      }
    });
    // $unwind to deconstruct the userDetails array. Preserve if no user found (e.g. user deleted)
    pipeline.push({ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } });

    // Lookup admin details for reviewedBy
    pipeline.push({
      $lookup: {
        from: 'admins', // The actual collection name for Admin model
        localField: 'reviewedBy',
        foreignField: '_id',
        as: 'adminDetails'
      }
    });
    // $unwind to deconstruct the adminDetails array. Preserve if not reviewed or admin deleted.
    pipeline.push({ $unwind: { path: '$adminDetails', preserveNullAndEmptyArrays: true } });

    // Filter by admin username (after lookup)
    if (adminUsername) {
      pipeline.push({ $match: { 'adminDetails.username': { $regex: adminUsername, $options: 'i' } } });
    }

    // Filter by user gamerTag or email (after lookup)
    if (userSearch) {
      pipeline.push({
        $match: {
          $or: [
            { 'userDetails.gamerTag': { $regex: userSearch, $options: 'i' } },
            { 'userDetails.email': { $regex: userSearch, $options: 'i' } }
          ]
        }
      });
    }
    
    // Project the desired fields to match the frontend's expected structure
    pipeline.push({
      $project: {
        _id: 1,
        amount: 1,
        status: 1,
        paymentMethod: 1,
        receiptData: 1, 
        receiptMimeType: 1,
        requestedAt: 1,
        reviewedAt: 1,
        adminNotes: 1,
        createdAt: 1, // Include if needed
        updatedAt: 1, // Include if needed
        user: { // Reshape user data
          _id: '$userDetails._id',
          gamerTag: '$userDetails.gamerTag',
          email: '$userDetails.email'
        },
        reviewedBy: { // Reshape admin data
          _id: '$adminDetails._id',
          username: '$adminDetails.username'
        }
      }
    });

    // Sort by requestedAt descending (newest first)
    pipeline.push({ $sort: { requestedAt: -1 } });

    const allRequests = await TopUpRequest.aggregate(pipeline);
    res.status(200).json(allRequests);

  } catch (error) {
    console.error('Get TopUp Request History Error:', error);
    res.status(500).json({ message: 'Server error while fetching request history.' });
  }
};


exports.approveTopUpRequest = async (req, res) => {
  const { requestId } = req.params;
  const adminId = req.admin.id;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Invalid request ID format.' });
    }
    const topUpRequest = await TopUpRequest.findById(requestId).session(session);
    if (!topUpRequest) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Top-up request not found.' });
    }
    if (topUpRequest.status !== 'pending') {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: `Request already ${topUpRequest.status}.` });
    }
    const userToCredit = await User.findById(topUpRequest.user).session(session);
    if (!userToCredit) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'User associated with the request not found.' });
    }
    const walletBalanceBefore = userToCredit.walletBalance;
    const loyaltyPointsBalanceBefore = userToCredit.loyaltyPoints;
    userToCredit.walletBalance += topUpRequest.amount;
    await userToCredit.save({ session });
    const newTransaction = new Transaction({
      user: userToCredit._id, type: 'top-up', amount: topUpRequest.amount,
      description: `Wallet top-up approved (Request ID: ${topUpRequest._id.toString().slice(-6)})`,
      relatedTopUpRequest: topUpRequest._id, walletBalanceBefore, walletBalanceAfter: userToCredit.walletBalance,
      loyaltyPointsChange: 0, loyaltyPointsBalanceBefore, loyaltyPointsBalanceAfter: userToCredit.loyaltyPoints,
      performedBy: adminId, timestamp: new Date()
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
        request: await TopUpRequest.findById(requestId).populate('user', 'gamerTag email').populate('reviewedBy', 'username')
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Approve TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while approving request.' });
  }
};

exports.rejectTopUpRequest = async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;
  const adminId = req.admin.id;
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
        request: await TopUpRequest.findById(requestId).populate('user', 'gamerTag email').populate('reviewedBy', 'username')
    });
  } catch (error) {
    console.error('Reject TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while rejecting request.' });
  }
};
    
