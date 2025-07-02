
const Booking = require('../models/Booking');
const Screen = require('../models/Screen');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
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
    }
  }
  return nodemailerTransporter;
}


// --- Booking Confirmation Email Sender ---
async function sendBookingConfirmationEmail(user, booking, screen, slot) {
  if (!user || !user.email) {
    console.warn(`User or user email not found for booking ${booking._id}. Skipping confirmation email.`);
    return;
  }

  try {
    const transporter = await getEmailTransporter();
    
    const startTimeLocal = new Date(slot.startTimeUTC).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
    const endTimeLocal = new Date(slot.endTimeUTC).toLocaleString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' });

    const subject = `Your WelloSphere Booking is Confirmed! (ID: ${booking._id.toString().slice(-6)})`;
    const locationLink = 'https://maps.app.goo.gl/Cy94pPNHEoKBN5DY8';

    const textBody = `
      Hello ${user.gamerTag},

      Your gaming session is confirmed!

      Details:
      - Screen: ${screen.name}
      - Date & Time: ${startTimeLocal} - ${endTimeLocal}
      - Price Paid: ₹${booking.pricePaid.toFixed(2)}

      Our Location:
      Get ready for your session! You can find us here:
      ${locationLink}

      We look forward to seeing you. Happy Gaming!
      The WelloSphere Team
    `;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello <strong>${user.gamerTag}</strong>,</p>
        <p>Your gaming session at WelloSphere is confirmed! Get ready for an epic experience.</p>
        
        <h3 style="color: #0056b3;">Booking Details:</h3>
        <ul>
          <li><strong>Screen:</strong> ${screen.name}</li>
          <li><strong>Date & Time:</strong> ${startTimeLocal} - ${endTimeLocal}</li>
          <li><strong>Price Paid:</strong> ₹${booking.pricePaid.toFixed(2)}</li>
        </ul>

        <h3 style="color: #0056b3;">Our Location:</h3>
        <p>You can find us at the address below. Click the button for easy navigation!</p>
        <p><a href="${locationLink}" style="font-size: 16px; color: #ffffff; background-color: #007BFF; padding: 12px 22px; text-decoration: none; border-radius: 5px; display: inline-block;">View on Google Maps</a></p>
        <br/>
        <p>We look forward to seeing you.</p>
        <p>Happy Gaming!<br/><strong>The WelloSphere Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER || '"WelloSphere Bookings" <bookings@wellosphere.example.com>',
      to: user.email,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${user.email}: %s`, info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL (Ethereal): %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error(`Error sending booking confirmation email for booking ${booking._id}:`, error.message);
    // Do not fail the main request if email notification fails
  }
}

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
    
    // Send booking confirmation email
    await sendBookingConfirmationEmail(user, newBooking, screen, validatedSlot);

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
