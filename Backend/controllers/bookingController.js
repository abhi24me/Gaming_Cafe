
const Booking = require('../models/Booking');
const Screen = require('../models/Screen');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Helper function to calculate slot price based on overrides (consistent with screenController)
function calculateSlotPrice(slotStartTimeUTC, screen) {
  const slotDayUTC = slotStartTimeUTC.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const slotTimeUTC = slotStartTimeUTC.getUTCHours() * 100 + slotStartTimeUTC.getUTCMinutes(); // e.g., 930 for 09:30

  if (screen.priceOverrides && screen.priceOverrides.length > 0) {
    for (const override of screen.priceOverrides) {
      if (override.daysOfWeek.includes(slotDayUTC)) {
        const overrideStartTime = parseInt(override.startTimeUTC.replace(':', ''), 10);
        const overrideEndTime = parseInt(override.endTimeUTC.replace(':', ''), 10);

        if (slotTimeUTC >= overrideStartTime && slotTimeUTC < overrideEndTime) {
          return override.price; // Use override price
        }
      }
    }
  }
  return screen.basePrice; // Fallback to base price
}


// Helper function to re-validate slot and get its details
async function getValidatedSlotDetails(screenId, dateString, slotId, expectedStartTimeUTC, expectedPrice) {
  const screen = await Screen.findById(screenId);
  if (!screen || !screen.isActive) {
    throw new Error('Screen not found or is not active.');
  }

  const targetDate_utc = new Date(dateString + 'T00:00:00.000Z');
  
  let foundSlot = null;
  const now_utc = new Date();

  // Reconstruct the slot that matches slotId to validate its properties
  const parts = slotId.split('-'); // e.g., "slot-YYYY-MM-DD-HH-MM"
  if (parts.length < 4 || parts[0] !== 'slot') {
    throw new Error('Invalid slotId format.');
  }
  const hour = parseInt(parts[parts.length-2]); // Assumes HH format (e.g., from slot-${date}-${hour}-30)
  const minute = parseInt(parts[parts.length-1]); // Assumes MM format

  if (isNaN(hour) || isNaN(minute)) {
      throw new Error('Invalid hour or minute in slotId.');
  }

  const slotStartTime_utc = new Date(targetDate_utc);
  slotStartTime_utc.setUTCHours(hour, minute, 0, 0); // Slot starts at HH:MM UTC

  const slotEndTime_utc = new Date(slotStartTime_utc);
  slotEndTime_utc.setUTCHours(slotStartTime_utc.getUTCHours() + 1, slotStartTime_utc.getUTCMinutes(), 0, 0); // Slot is 1 hour long

  // Basic validation against client-provided details
  if (slotStartTime_utc.toISOString() !== expectedStartTimeUTC) {
    throw new Error('Slot start time mismatch. Please refresh and try again.');
  }
  
  const serverCalculatedPrice = calculateSlotPrice(slotStartTime_utc, screen);
  if (serverCalculatedPrice !== expectedPrice) {
      throw new Error(`Slot price mismatch. Expected ${expectedPrice}, got ${serverCalculatedPrice}. Please refresh and try again.`);
  }

  // Check availability (past and overlap)
  const isSlotInThePast = slotEndTime_utc <= now_utc;
  if (isSlotInThePast) {
      throw new Error('Selected slot is in the past.');
  }

  const existingBookings = await Booking.find({
    screen: screenId,
    status: { $in: ['upcoming', 'active'] },
    $or: [
      { startTime: { $lt: slotEndTime_utc, $gte: slotStartTime_utc } },
      { endTime: { $gt: slotStartTime_utc, $lte: slotEndTime_utc } },
      { startTime: { $lte: slotStartTime_utc }, endTime: { $gte: slotEndTime_utc } }
    ]
  });

  if (existingBookings.length > 0) {
    throw new Error('The selected time slot is no longer available. Please choose another.');
  }
  
  foundSlot = {
    id: slotId, // Use the provided slotId
    startTimeUTC: slotStartTime_utc,
    endTimeUTC: slotEndTime_utc,
    price: serverCalculatedPrice,
    isAvailable: true // If we reach here and pass checks, it's considered available for booking
  };
  

  if (!foundSlot) {
    throw new Error('Selected slot details could not be validated or found. Please refresh.');
  }
  return foundSlot;
}


// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const { screenId, date: dateString, slotId, startTimeUTC: clientStartTimeUTC, pricePaid, gamerTag } = req.body;
  const userId = req.user.id;

  if (!screenId || !dateString || !slotId || !clientStartTimeUTC || pricePaid === undefined || !gamerTag) {
    return res.status(400).json({ message: 'Screen ID, date, slot ID, start time UTC, price, and gamer tag are required.' });
  }

  const numericPricePaid = parseFloat(pricePaid);
  if (isNaN(numericPricePaid) || numericPricePaid < 0) {
    return res.status(400).json({ message: 'Invalid price specified.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate the slot details sent by the client against server's current state
    // This will also calculate the correct price based on overrides
    const validatedSlot = await getValidatedSlotDetails(screenId, dateString, slotId, clientStartTimeUTC, numericPricePaid);
    // validatedSlot contains startTimeUTC, endTimeUTC, price

    if (user.walletBalance < validatedSlot.price) { // Use validatedSlot.price
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: `Insufficient wallet balance. Cost: ${validatedSlot.price.toFixed(2)}, Balance: ${user.walletBalance.toFixed(2)}` });
    }

    const screen = await Screen.findById(screenId).session(session); 
     if (!screen) { 
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Screen not found for booking record.' });
    }

    const walletBalanceBefore = user.walletBalance;
    const loyaltyPointsBefore = user.loyaltyPoints;

    user.walletBalance -= validatedSlot.price;
    const pointsAwarded = 10; 
    user.loyaltyPoints += pointsAwarded;

    await user.save({ session });

    const newBooking = new Booking({
      user: userId,
      screen: screenId,
      startTime: validatedSlot.startTimeUTC, 
      endTime: validatedSlot.endTimeUTC,   
      status: 'upcoming',
      pricePaid: validatedSlot.price, 
      gamerTagAtBooking: gamerTag, 
      bookedAt: new Date()
    });
    await newBooking.save({ session });
    
    // Using validatedSlot.startTimeUTC for formatting transaction description
    const transactionTimeDisplay = validatedSlot.startTimeUTC.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });
    const transactionDateDisplay = new Date(dateString + 'T00:00:00.000Z').toLocaleDateString('en-CA');

    const newTransaction = new Transaction({
      user: userId,
      type: 'booking-fee',
      amount: -validatedSlot.price, 
      description: `Booking: ${screen.name} on ${transactionDateDisplay} at ${transactionTimeDisplay} (UTC)`,
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
      booking: await Booking.findById(newBooking._id).populate('screen', 'name imagePlaceholderUrl'),
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
    console.error('Create Booking Error:', error.message); 
    res.status(500).json({ message: error.message || 'Server error while creating booking.' });
  }
};

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('screen', 'name imagePlaceholderUrl imageAiHint') 
      .sort({ startTime: -1 }); 

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings.' });
  }
};

