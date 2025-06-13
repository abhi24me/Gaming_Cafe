
const Booking = require('../models/Booking');
const Screen = require('../models/Screen');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Helper to parse date and time slot string into Date objects
// IMPORTANT: This assumes the timeSlot string is in "H:MM AM/PM - H:MM AM/PM" format
// and the date string is "YYYY-MM-DD".
// It also assumes the times are for the *local timezone of the server* or where the date string is interpreted.
// For production, ensure consistent timezone handling (e.g., all dates in UTC).
const parseDateTimeSlot = (dateString, timeSlotString) => {
  const [startTimeStr, endTimeStr] = timeSlotString.split(' - ');

  // Function to parse "H:MM AM/PM" into hours and minutes
  const parseTime = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0; // Midnight case
    return { hours, minutes };
  };

  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);

  const baseDate = new Date(dateString + 'T00:00:00.000Z'); // Treat dateString as UTC to set day

  const startTime = new Date(baseDate);
  startTime.setUTCHours(start.hours, start.minutes, 0, 0);

  const endTime = new Date(baseDate);
  endTime.setUTCHours(end.hours, end.minutes, 0, 0);

  // Handle cases where endTime might roll over to the next day (e.g. 11:00 PM - 12:00 AM)
  // This simple parser doesn't handle that; a more robust one would.
  // For 1-hour slots, this usually isn't an issue unless booking across midnight.
  // If slot duration can vary, this needs more care.

  return { startTime, endTime };
};


// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const { screenId, date, timeSlot, pricePaid, gamerTag } = req.body;
  const userId = req.user.id;

  if (!screenId || !date || !timeSlot || pricePaid === undefined || !gamerTag) {
    return res.status(400).json({ message: 'Screen ID, date, time slot, price, and gamer tag are required.' });
  }

  const numericPricePaid = parseFloat(pricePaid);
  if (isNaN(numericPricePaid) || numericPricePaid < 0) { // Price can be 0 for free slots/promos
    return res.status(400).json({ message: 'Invalid price specified.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const screen = await Screen.findById(screenId).session(session);
    if (!screen || !screen.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Screen not found or is not active.' });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.walletBalance < numericPricePaid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Insufficient wallet balance. Current balance: ${user.walletBalance.toFixed(2)}` });
    }

    const { startTime, endTime } = parseDateTimeSlot(date, timeSlot);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid date or time slot format provided.' });
    }

    // Critical: Check for overlapping bookings again at the time of creation
    const existingBookings = await Booking.find({
      screen: screenId,
      status: { $in: ['upcoming', 'active'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    }).session(session);

    if (existingBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: 'The selected time slot is no longer available. Please choose another.' });
    }

    // Record wallet balance before deduction
    const walletBalanceBefore = user.walletBalance;
    const loyaltyPointsBefore = user.loyaltyPoints;

    // Deduct from wallet
    user.walletBalance -= numericPricePaid;

    // Award loyalty points (e.g., 10 points per booking)
    const pointsAwarded = 10; // Make this configurable if needed
    user.loyaltyPoints += pointsAwarded;

    await user.save({ session });

    // Create Booking
    const newBooking = new Booking({
      user: userId,
      screen: screenId,
      startTime,
      endTime,
      status: 'upcoming',
      pricePaid: numericPricePaid,
      gamerTagAtBooking: gamerTag, // Use the provided gamerTag
      bookedAt: new Date()
    });
    await newBooking.save({ session });

    // Create Transaction
    const newTransaction = new Transaction({
      user: userId,
      type: 'booking-fee',
      amount: -numericPricePaid, // Negative as it's a deduction
      description: `Booking fee for ${screen.name} on ${date} at ${timeSlot}`,
      relatedBooking: newBooking._id,
      walletBalanceBefore: walletBalanceBefore,
      walletBalanceAfter: user.walletBalance,
      loyaltyPointsChange: pointsAwarded,
      loyaltyPointsBalanceBefore: loyaltyPointsBefore,
      loyaltyPointsBalanceAfter: user.loyaltyPoints,
      timestamp: new Date()
    });
    await newTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Booking created successfully!',
      booking: newBooking,
      transaction: newTransaction,
      newBalance: user.walletBalance,
      newLoyaltyPoints: user.loyaltyPoints
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create Booking Error:', error);
    res.status(500).json({ message: 'Server error while creating booking.' });
  }
};



// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('screen', 'name imagePlaceholderUrl') // Populate screen details
      .sort({ startTime: -1 }); // Show most recent/upcoming first

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings.' });
  }
};