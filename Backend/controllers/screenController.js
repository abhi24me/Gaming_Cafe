
const Screen = require('../models/Screen');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// Helper function to calculate slot price based on overrides
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


// @desc    Get all active screens
// @route   GET /api/screens
// @access  Public (or Private)
exports.listScreens = async (req, res) => {
  try {
    const screens = await Screen.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(screens);
  } catch (error) {
    console.error('List Screens Error:', error);
    res.status(500).json({ message: 'Server error while fetching screens.' });
  }
};

// @desc    Get available time slots for a specific screen on a given date
// @route   GET /api/screens/:screenId/availability?date=YYYY-MM-DD
// @access  Public (or Private)
exports.getScreenAvailability = async (req, res) => {
  const { screenId } = req.params;
  const { date } = req.query; 

  if (!mongoose.Types.ObjectId.isValid(screenId)) {
    return res.status(400).json({ message: 'Invalid screen ID format.' });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) query parameter is required.' });
  }

  try {
    const screen = await Screen.findById(screenId);
    if (!screen || !screen.isActive) {
      return res.status(404).json({ message: 'Screen not found or is not active.' });
    }

    const targetDate_utc = new Date(date + 'T00:00:00.000Z'); 

    const nextDateForQuery_utc = new Date(targetDate_utc);
    nextDateForQuery_utc.setUTCDate(targetDate_utc.getUTCDate() + 1);

    const existingBookings = await Booking.find({
      screen: screenId,
      status: { $in: ['upcoming', 'active'] },
      startTime: { $gte: targetDate_utc, $lt: nextDateForQuery_utc }
    }).select('startTime endTime');

    const slots = [];
    const now_utc = new Date();

    for (let hour = 0; hour < 24; hour++) {
      const slotStartTime_utc = new Date(targetDate_utc);
      slotStartTime_utc.setUTCHours(hour, 30, 0, 0); // Slot starts at HH:30 UTC

      const slotEndTime_utc = new Date(targetDate_utc);
      slotEndTime_utc.setUTCHours(hour + 1, 30, 0, 0); // Slot ends at (HH+1):30 UTC

      const isSlotInThePast = slotEndTime_utc <= now_utc;
      
      let isOverlappingBooking = false;
      if (!isSlotInThePast) {
        for (const booking of existingBookings) {
          if (booking.startTime < slotEndTime_utc && booking.endTime > slotStartTime_utc) {
            isOverlappingBooking = true;
            break;
          }
        }
      }
      
      const finalIsAvailable = !isSlotInThePast && !isOverlappingBooking;
      
      const currentSlotPrice = calculateSlotPrice(slotStartTime_utc, screen);

      // The `time` string is a fallback/debug display; frontend uses UTC times for accurate local formatting
      const startHourDisplay = slotStartTime_utc.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      const endHourDisplay = slotEndTime_utc.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      const timeStringForDebug = `${startHourDisplay} - ${endHourDisplay}`;

      slots.push({
        id: `slot-${date}-${hour}-30`, // Make ID unique for half-hour slots
        time: timeStringForDebug, 
        startTimeUTC: slotStartTime_utc.toISOString(), 
        endTimeUTC: slotEndTime_utc.toISOString(),   
        isAvailable: finalIsAvailable,
        price: currentSlotPrice 
      });
    }

    res.status(200).json({ screenName: screen.name, date: date, slots: slots });

  } catch (error) {
    console.error('Get Screen Availability Error:', error);
    res.status(500).json({ message: 'Server error while fetching screen availability.' });
  }
};

