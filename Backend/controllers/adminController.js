
const TopUpRequest = require('../models/TopUpRequest');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction');
const Screen = require('../models/Screen');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// --- Nodemailer Transporter Setup ---
let nodemailerTransporter;

async function getEmailTransporter() {
  if (nodemailerTransporter) {
    try {
      await nodemailerTransporter.verify();
      return nodemailerTransporter;
    } catch (error) {
      console.warn("Existing email transporter verification failed, re-initializing.", error.message);
      nodemailerTransporter = null;
    }
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    nodemailerTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('Using production SMTP transporter.');
    try {
      await nodemailerTransporter.verify();
      console.log('Production SMTP transporter verified.');
    } catch(err) {
      console.error('Production SMTP transporter verification failed:', err);
      nodemailerTransporter = null; // Invalidate on failure
    }
  }

  if (!nodemailerTransporter) {
    try {
      let testAccount = await nodemailer.createTestAccount();
      nodemailerTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('Using Ethereal Email transporter for testing. Preview URL for emails will be logged.');
    } catch (err) {
      console.error('Failed to create Ethereal test account or transporter:', err.message);
      nodemailerTransporter = {
        sendMail: () => Promise.reject(new Error("Email transporter (Ethereal) not configured due to setup failure.")),
        verify: () => Promise.reject(new Error("Ethereal transporter setup failed verification."))
      };
      console.error("Email notifications will not be sent as Ethereal transporter setup failed.");
    }
  }
  return nodemailerTransporter;
}

// Function to send email notification to the user about their top-up request status
async function sendUserTopUpStatusNotification(user, request) {
  if (!user || !user.email) {
    console.warn(`User or user email not found for request ${request._id}. Skipping notification.`);
    return;
  }

  try {
    const transporter = await getEmailTransporter();
    const isApproved = request.status === 'approved';
    const subject = `Update on your Tron Gaming Top-Up Request: ${isApproved ? 'Approved' : 'Rejected'}`;
    
    const topUpAmount = Number(request.amount);
    let bonusPercentage = 0;
    if (topUpAmount >= 1000) {
      bonusPercentage = 0.12;
    } else if (topUpAmount >= 500) {
      bonusPercentage = 0.08;
    } else if (topUpAmount >= 200) {
      bonusPercentage = 0.05;
    }
    
    const bonusAmount = topUpAmount * bonusPercentage;
    const totalCreditAmount = topUpAmount + bonusAmount;
    
    let textBody;
    let htmlBody;

    if (isApproved) {
        textBody = `Hello ${user.gamerTag},\n\nGreat news! Your top-up request for ₹${topUpAmount.toFixed(2)} has been approved.`;
        if (bonusAmount > 0) {
            textBody += ` You've received a bonus of ₹${bonusAmount.toFixed(2)}. A total of ₹${totalCreditAmount.toFixed(2)} has been added to your wallet.`;
        } else {
            textBody += ` The amount has been added to your wallet.`;
        }
        textBody += `\n\nHappy Gaming!\nThe Tron Gaming Team`;
        
        htmlBody = `
            <p>Hello ${user.gamerTag},</p>
            <p>Great news! Your top-up request for <strong>₹${topUpAmount.toFixed(2)}</strong> has been approved.</p>
        `;
        if (bonusAmount > 0) {
            htmlBody += `<p>For this top-up, you've received a special bonus of <strong>₹${bonusAmount.toFixed(2)}</strong>!</p>
            <p>A total of <strong>₹${totalCreditAmount.toFixed(2)}</strong> has been added to your Tron Gaming wallet.</p>`;
        } else {
            htmlBody += `<p>The amount has been added to your Tron Gaming wallet.</p>`;
        }
        htmlBody += `
            <p>Happy Gaming!</p>
            <p>The Tron Gaming Team</p>
        `;
    } else { // Rejection email
      textBody = `Hello ${user.gamerTag},\n\nWe have an update on your top-up request for ₹${request.amount.toFixed(2)}. Unfortunately, it has been rejected.\n\nReason: ${request.adminNotes || 'No specific reason provided. Please contact support if you have questions.'}\n\nRegards,\nThe Tron Gaming Team`;
      htmlBody = `
        <p>Hello ${user.gamerTag},</p>
        <p>We have an update on your top-up request for <strong>₹${request.amount.toFixed(2)}</strong>. Unfortunately, it has been rejected.</p>
        <p><strong>Reason:</strong> ${request.adminNotes || 'No specific reason provided. Please contact support if you have questions.'}</p>
        <p>Regards,</p>
        <p>The Tron Gaming Team</p>
      `;
    }

    const mailOptions = {
      from: process.env.SMTP_USER || '"Tron Gaming Notifications" <noreply@Tron Gaming.example.com>',
      to: user.email,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log(`User status notification email sent to ${user.email}: %s`, info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL (Ethereal): %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error(`Error sending user status notification email for request ${request._id}:`, error.message);
  }
}


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
      .populate('user', 'gamerTag email walletBalance phoneNumber') // Added phoneNumber
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
    let initialMatchConditions = {};
    if (startDate) initialMatchConditions.requestedAt = { ...initialMatchConditions.requestedAt, $gte: new Date(startDate) };
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      initialMatchConditions.requestedAt = { ...initialMatchConditions.requestedAt, $lte: endOfDay };
    }
    if(Object.keys(initialMatchConditions).length > 0) pipeline.push({ $match: initialMatchConditions });
    pipeline.push({ $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } });
    pipeline.push({ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $lookup: { from: 'admins', localField: 'reviewedBy', foreignField: '_id', as: 'adminDetails' } });
    pipeline.push({ $unwind: { path: '$adminDetails', preserveNullAndEmptyArrays: true } });
    if (adminUsername) pipeline.push({ $match: { 'adminDetails.username': { $regex: adminUsername, $options: 'i' } } });
    if (userSearch) pipeline.push({ $match: { $or: [ { 'userDetails.gamerTag': { $regex: userSearch, $options: 'i' } }, { 'userDetails.email': { $regex: userSearch, $options: 'i' } } ] } });
    pipeline.push({ $project: { _id: 1, amount: 1, status: 1, paymentMethod: 1, receiptData: 1, receiptMimeType: 1, requestedAt: 1, reviewedAt: 1, adminNotes: 1, createdAt: 1, updatedAt: 1, user: { _id: '$userDetails._id', gamerTag: '$userDetails.gamerTag', email: '$userDetails.email', phoneNumber: '$userDetails.phoneNumber' }, reviewedBy: { _id: '$adminDetails._id', username: '$adminDetails.username' } } });
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
  let userToCredit;
  let topUpRequest;
  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Invalid request ID format.' });
    }
    topUpRequest = await TopUpRequest.findById(requestId).session(session);
    if (!topUpRequest) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Top-up request not found.' });
    }
    if (topUpRequest.status !== 'pending') {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: `Request already ${topUpRequest.status}.` });
    }

    // --- Bonus Calculation (Robust) ---
    const topUpAmount = Number(topUpRequest.amount);
    let bonusPercentage = 0;
    if (topUpAmount >= 1000) {
      bonusPercentage = 0.12;
    } else if (topUpAmount >= 500) {
      bonusPercentage = 0.08;
    } else if (topUpAmount >= 200) {
      bonusPercentage = 0.05;
    }
    const bonusAmount = topUpAmount * bonusPercentage;
    const totalCreditAmount = topUpAmount + bonusAmount;
    // --- End Bonus Calculation ---

    userToCredit = await User.findById(topUpRequest.user).session(session);
    if (!userToCredit) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'User associated with the request not found.' });
    }
    const walletBalanceBefore = Number(userToCredit.walletBalance);
    const loyaltyPointsBalanceBefore = userToCredit.loyaltyPoints;
    
    // Update wallet balance using robust method
    const newWalletBalance = walletBalanceBefore + totalCreditAmount;
    userToCredit.walletBalance = Math.round(newWalletBalance * 100) / 100; // Round to 2 decimal places
    
    await userToCredit.save({ session });

    const transactionDescription = `Wallet top-up approved (₹${topUpAmount.toFixed(2)})${bonusAmount > 0 ? ` + ₹${bonusAmount.toFixed(2)} bonus` : ''}. Request ID: ${topUpRequest._id.toString().slice(-6)}`;

    const newTransaction = new Transaction({
      user: userToCredit._id,
      type: 'top-up',
      amount: Math.round(totalCreditAmount * 100) / 100,
      description: transactionDescription,
      relatedTopUpRequest: topUpRequest._id,
      walletBalanceBefore,
      walletBalanceAfter: userToCredit.walletBalance,
      loyaltyPointsChange: 0,
      loyaltyPointsBalanceBefore,
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

    // Send notification email to the user
    await sendUserTopUpStatusNotification(userToCredit, topUpRequest);

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

    // Send notification email to the user
    const user = await User.findById(topUpRequest.user).select('email gamerTag');
    if (user) {
        await sendUserTopUpStatusNotification(user, topUpRequest);
    } else {
        console.warn(`Could not find user ${topUpRequest.user} to send rejection email.`);
    }

    res.status(200).json({
        message: 'Top-up request rejected.',
        request: await TopUpRequest.findById(requestId).populate('user', 'gamerTag email').populate('reviewedBy', 'username')
    });
  } catch (error) {
    console.error('Reject TopUp Request Error:', error);
    res.status(500).json({ message: 'Server error while rejecting request.' });
  }
};

exports.getBookings = async (req, res) => {
  const { date } = req.query;
  try {
    let query = {};

    if (date) {
      // Get bookings for a specific day
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default to upcoming bookings from now
      query.status = { $in: ['upcoming', 'active'] };
      query.startTime = { $gte: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'gamerTag email')
      .populate('screen', 'name')
      .sort({ startTime: 'asc' });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get Admin Bookings Error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings.' });
  }
};


// --- Screen Management by Admin ---
exports.getScreensForAdmin = async (req, res) => {
  try {
    const screens = await Screen.find({}).sort({ name: 1 });
    res.status(200).json(screens);
  } catch (error) {
    console.error('Get Screens for Admin Error:', error);
    res.status(500).json({ message: 'Server error while fetching screens for admin.' });
  }
};

exports.addScreenPriceOverride = async (req, res) => {
  const { screenId } = req.params;
  const { daysOfWeek, startTimeUTC, endTimeUTC, price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(screenId)) {
    return res.status(400).json({ message: 'Invalid screen ID format.' });
  }

  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || !daysOfWeek.every(day => typeof day === 'number' && day >= 0 && day <= 6)) {
    return res.status(400).json({ message: 'Days of week must be a non-empty array of numbers between 0 and 6.' });
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!startTimeUTC || !timeRegex.test(startTimeUTC)) {
    return res.status(400).json({ message: 'Start time UTC must be in HH:MM format.' });
  }
  if (!endTimeUTC || !timeRegex.test(endTimeUTC)) {
    return res.status(400).json({ message: 'End time UTC must be in HH:MM format.' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ message: 'Price must be a non-negative number.' });
  }

  try {
    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found.' });
    }

    const newOverride = {
      daysOfWeek: [...new Set(daysOfWeek)].sort((a,b)=>a-b),
      startTimeUTC,
      endTimeUTC,
      price,
    };

    screen.priceOverrides.push(newOverride);
    await screen.save();

    res.status(201).json({ message: 'Price override added successfully.', screen });
  } catch (error) {
    console.error('Add Screen Price Override Error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while adding price override.' });
  }
};

exports.removeScreenPriceOverride = async (req, res) => {
  const { screenId, overrideId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(screenId) || !mongoose.Types.ObjectId.isValid(overrideId)) {
    return res.status(400).json({ message: 'Invalid screen ID or override ID format.' });
  }

  try {
    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found.' });
    }

    const overrideExists = screen.priceOverrides.some(ov => ov._id.toString() === overrideId);
    if (!overrideExists) {
        return res.status(404).json({ message: 'Price override not found on this screen.' });
    }

    screen.priceOverrides.pull({ _id: overrideId });
    await screen.save();

    res.status(200).json({ message: 'Price override removed successfully.', screen });
  } catch (error) {
    console.error('Remove Screen Price Override Error:', error);
    res.status(500).json({ message: 'Server error while removing price override.' });
  }
};

// Placeholder for updateScreenBasePrice
exports.updateScreenBasePrice = async (req, res) => {
  res.status(501).json({ message: 'Not Implemented: Update Screen Base Price' });
};

exports.sendPromoEmail = async (req, res) => {
  const { subject, htmlBody } = req.body;
  const adminId = req.admin.id;

  if (!subject || !htmlBody) {
    return res.status(400).json({ message: 'Email subject and HTML body are required.' });
  }

  try {
    const users = await User.find({ email: { $ne: null, $exists: true } }).select('email');
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users with registered emails found.' });
    }

    const transporter = await getEmailTransporter();
    const userEmails = users.map(user => user.email);

    const mailOptions = {
      from: process.env.SMTP_USER || '"Tron Gaming Promotions" <promo@Tron Gaming.example.com>',
      bcc: userEmails.join(', '),
      subject: subject,
      html: htmlBody,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log(`Promotional email sent by admin ${adminId} to ${userEmails.length} users. Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL (Ethereal): %s", nodemailer.getTestMessageUrl(info));
    }
    
    res.status(200).json({ message: `Promotional email sent successfully to ${userEmails.length} users.` });

  } catch (error) {
    console.error(`Error sending promotional email by admin ${adminId}:`, error);
    res.status(500).json({ message: 'Server error while sending promotional emails.' });
  }
};
