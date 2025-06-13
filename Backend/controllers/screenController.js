
const Screen = require('../models/Screen');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// @desc    Get all active screens
// @route   GET /api/screens
// @access  Public (or Private)
exports.listScreens = async (req, res) => {
  try {
    // Fetch only active screens, can add pagination later if needed
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
  const { date } = req.query; // Expecting date in 'YYYY-MM-DD' format

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

    const targetDate = new Date(date + 'T00:00:00.000Z'); // Start of the target day in UTC
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(targetDate.getUTCDate() + 1); // Start of the next day in UTC

    // Find existing bookings for this screen on the target date
    const existingBookings = await Booking.find({
      screen: screenId,
      status: { $in: ['upcoming', 'active'] }, // Consider only non-cancelled/completed bookings
      startTime: { $gte: targetDate, $lt: nextDate }
    }).select('startTime endTime');

    // Generate potential 1-hour slots for the entire day (00:00 to 23:00 start times)
    // This should match how your frontend generates/displays slots
    const slots = [];
    const now = new Date();

    for (let hour = 0; hour < 24; hour++) {
      const slotStartTime = new Date(targetDate);
      slotStartTime.setUTCHours(hour, 0, 0, 0);

      const slotEndTime = new Date(targetDate);
      slotEndTime.setUTCHours(hour + 1, 0, 0, 0);

      let isAvailable = true;

      // Check if slot is in the past (relative to current server time)
      if (slotEndTime <= now) {
        isAvailable = false;
      } else {
        // Check for overlaps with existing bookings
        for (const booking of existingBookings) {
          // Check if booking.startTime < slotEndTime AND booking.endTime > slotStartTime
          if (booking.startTime < slotEndTime && booking.endTime > slotStartTime) {
            isAvailable = false;
            break;
          }
        }
      }
      
      // Consistent time string format as used in mockData for frontend (AM/PM)
      const startTimeString = slotStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      const endTimeString = slotEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });

      slots.push({
        id: `slot-${date}-${hour}`, // A unique ID for the slot
        time: `${startTimeString} - ${endTimeString}`, // e.g., "10:00 AM - 11:00 AM"
        startTimeUTC: slotStartTime.toISOString(),
        endTimeUTC: slotEndTime.toISOString(),
        isAvailable: isAvailable,
        price: 100 // Default price, can be made dynamic from Screen model later
      });
    }

    res.status(200).json({ screenName: screen.name, date: date, slots: slots });

  } catch (error) {
    console.error('Get Screen Availability Error:', error);
    res.status(500).json({ message: 'Server error while fetching screen availability.' });
  }
};


// @desc    Get details of a single screen (Optional)
// @route   GET /api/screens/:screenId
// @access  Public
// exports.getScreenDetails = async (req, res) => {
//   const { screenId } = req.params;
//   if (!mongoose.Types.ObjectId.isValid(screenId)) {
//       return res.status(400).json({ message: 'Invalid screen ID format.' });
//   }
//   try {
//       const screen = await Screen.findById(screenId);
//       if (!screen || !screen.isActive) {
//           return res.status(404).json({ message: 'Screen not found or is not active.' });
//       }
//       res.status(200).json(screen);
//   } catch (error) {
//       console.error('Get Screen Details Error:', error);
//       res.status(500).json({ message: 'Server error while fetching screen details.' });
//   }
// };
