
const Booking = require('../models/Booking');
const Screen = require('../models/Screen');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Helper function to re-validate slot and get its details
// This function would be similar to a portion of getScreenAvailability
// but focused on a single slotId for a given screen and date.
async function getValidatedSlotDetails(screenId, dateString, slotId, expectedStartTimeUTC, expectedPrice) {
  const screen = await Screen.findById(screenId);
  if (!screen || !screen.isActive) {
    throw new Error('Screen not found or is not active.');
  }

  const targetDate_utc = new Date(dateString + 'T00:00:00.000Z');
  const nextDateForQuery_utc = new Date(targetDate_utc);
  nextDateForQuery_utc.setUTCDate(targetDate_utc.getUTCDate() + 1);

  // Regenerate slots for the day to find the specific one by ID
  // This logic must exactly match how slots are generated in screenController.getScreenAvailability
  let foundSlot = null;
  const now_utc = new Date();

  for (let hour = 0; hour < 24; hour++) {
    const currentGeneratedSlotId = `slot-${dateString}-${hour}-30`; // Matches screenController's ID generation
    if (currentGeneratedSlotId === slotId) {
      const slotStartTime_utc = new Date(targetDate_utc);
      slotStartTime_utc.setUTCHours(hour, 30, 0, 0);

      const slotEndTime_utc = new Date(targetDate_utc);
      slotEndTime_utc.setUTCHours(hour + 1, 30, 0, 0);
      
      // Basic validation against client-provided details
      if (slotStartTime_utc.toISOString() !== expectedStartTimeUTC) {
        throw new Error('Slot start time mismatch. Please refresh and try again.');
      }
      const price = screen.basePrice || 100;
      if (price !== expectedPrice) {
          throw new Error('Slot price mismatch. Please refresh and try again.');
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
        id: currentGeneratedSlotId,
        startTimeUTC: slotStartTime_utc,
        endTimeUTC: slotEndTime_utc,
        price: price,
        isAvailable: true // If we reach here and pass checks, it's considered available for booking
      };
      break; 
    }
  }

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

    if (user.walletBalance < numericPricePaid) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: `Insufficient wallet balance. Current balance: ${user.walletBalance.toFixed(2)}` });
    }

    // Validate the slot details sent by the client against server's current state
    const validatedSlot = await getValidatedSlotDetails(screenId, dateString, slotId, clientStartTimeUTC, numericPricePaid);
    // validatedSlot contains startTimeUTC, endTimeUTC, price

    const screen = await Screen.findById(screenId).session(session); // Fetch screen again for name, etc.
     if (!screen) { // Should be caught by getValidatedSlotDetails, but double check
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Screen not found for booking record.' });
    }


    // Record balances before changes
    const walletBalanceBefore = user.walletBalance;
    const loyaltyPointsBefore = user.loyaltyPoints;

    // Update user's wallet and loyalty points
    user.walletBalance -= numericPricePaid; // numericPricePaid is already validated to match server slot price
    const pointsAwarded = 10; 
    user.loyaltyPoints += pointsAwarded;

    await user.save({ session });

    // Create the new booking using validated UTC times
    const newBooking = new Booking({
      user: userId,
      screen: screenId,
      startTime: validatedSlot.startTimeUTC, 
      endTime: validatedSlot.endTimeUTC,   
      status: 'upcoming',
      pricePaid: numericPricePaid, // Use the validated price
      gamerTagAtBooking: gamerTag, 
      bookedAt: new Date()
    });
    await newBooking.save({ session });
    
    // Format time for transaction description (can be local to server, or stick to UTC for consistency)
    const transactionTimeDisplay = validatedSlot.startTimeUTC.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' // Or user's local if known and desired
    });
    const transactionDateDisplay = new Date(dateString + 'T00:00:00.000Z').toLocaleDateString('en-CA');


    // Create a transaction record
    const newTransaction = new Transaction({
      user: userId,
      type: 'booking-fee',
      amount: -numericPricePaid, 
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
    console.error('Create Booking Error:', error.message); // Log full error message
    res.status(500).json({ message: error.message || 'Server error while creating booking.' });
  }
};

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('screen', 'name imagePlaceholderUrl imageAiHint') // Populate screen details
      .sort({ startTime: -1 }); 

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings.' });
  }
};
