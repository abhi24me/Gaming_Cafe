
const Screen = require('../models/Screen');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// Helper function to calculate slot price based on overrides
function calculateSlotPrice(slotStartTimeUTC, screen) {
  // Convert the slot's UTC time to IST to correctly determine the day of the week
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours for IST
  const slotTimeInIST = new Date(slotStartTimeUTC.getTime() + istOffset);
  const slotDayIST = slotTimeInIST.getUTCDay(); // Get day of week in IST (0=Sun, 6=Sat)

  // Get the slot's hour and minute in UTC for time range comparison
  const slotTimeUTC = slotStartTimeUTC.getUTCHours() * 100 + slotStartTimeUTC.getUTCMinutes();

  if (screen.priceOverrides && screen.priceOverrides.length > 0) {
    for (const override of screen.priceOverrides) {
      // Check if the override applies to the slot's day (in IST)
      if (override.daysOfWeek.includes(slotDayIST)) {
        
        const overrideStartTimeUTC = parseInt(override.startTimeUTC.replace(':', ''), 10);
        const overrideEndTimeUTC = parseInt(override.endTimeUTC.replace(':', ''), 10);

        const isOvernightRange = overrideEndTimeUTC < overrideStartTimeUTC;

        let isTimeMatch = false;
        if (isOvernightRange) {
          // For ranges that cross midnight UTC (e.g., 22:00-02:00), the condition is OR
          if (slotTimeUTC >= overrideStartTimeUTC || slotTimeUTC < overrideEndTimeUTC) {
            isTimeMatch = true;
          }
        } else {
          // For ranges within a single day UTC (e.g., 09:00-17:00), the condition is AND
          if (slotTimeUTC >= overrideStartTimeUTC && slotTimeUTC < overrideEndTimeUTC) {
            isTimeMatch = true;
          }
        }

        if (isTimeMatch) {
          return override.price; // Matched an override, return its price
        }
      }
    }
  }

  return screen.basePrice; // No matching override found, return base price
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

    // Define the IST day in terms of UTC
    const startOfDayInIST = new Date(`${date}T00:00:00.000+05:30`);
    const endOfDayInIST = new Date(startOfDayInIST);
    endOfDayInIST.setDate(endOfDayInIST.getDate() + 1);

    const existingBookings = await Booking.find({
      screen: screenId,
      status: { $in: ['upcoming', 'active'] },
      startTime: { $gte: startOfDayInIST, $lt: endOfDayInIST }
    }).select('startTime endTime');

    const slots = [];
    const now_utc = new Date();

    // Loop through hours of the day in IST (0 to 23)
    for (let istHour = 0; istHour < 24; istHour++) {
      const slotStartTime_utc = new Date(`${date}T${String(istHour).padStart(2, '0')}:00:00.000+05:30`);
      const slotEndTime_utc = new Date(slotStartTime_utc);
      slotEndTime_utc.setHours(slotEndTime_utc.getHours() + 1);

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
        id: `slot-${date}-${istHour}`, // ID is based on IST hour now
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

