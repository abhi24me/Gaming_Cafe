const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Reference to a User document
    ref: 'User', // The model to use for population
    required: [true, 'User is required for a booking']
  },
  screen: {
    type: mongoose.Schema.Types.ObjectId, // Reference to a Screen document
    ref: 'Screen', // The model to use for population
    required: [true, 'Screen is required for a booking']
  },
  // In a real system, you'd likely store precise start and end times
  // to prevent overlaps and manage availability accurately.
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  // For simplicity, your frontend uses a string like "10:00 AM - 11:00 AM".
  // Storing precise Date objects for startTime and endTime is more robust for backend logic.
  // You might also store the original timeSlot string for display consistency if needed.
  // timeSlotString: {
  //   type: String,
  //   required: true
  // },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled', 'active'], // 'active' for currently in-session
    default: 'upcoming',
    required: true
  },
  pricePaid: {
    type: Number,
    required: [true, 'Price paid is required for a booking']
  },
  gamerTagAtBooking: { // Store the gamerTag at the time of booking, in case user changes it later
    type: String,
    required: [true, 'Gamer Tag at the time of booking is required'],
    trim: true
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  // Optional: notes or special requests for the booking
  // notes: {
  //   type: String,
  //   trim: true
  // },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update `updatedAt` field on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Example of an index to improve query performance for finding bookings by user or screen
bookingSchema.index({ user: 1, startTime: -1 }); // Get user's bookings, newest first
bookingSchema.index({ screen: 1, startTime: 1, endTime: 1 }); // Check for screen availability

// Static method to check for overlapping bookings (example)
// This logic would typically be more complex and might reside in a service or controller
bookingSchema.statics.findOverlappingBookings = function(screenId, startTime, endTime, excludeBookingId = null) {
  const query = {
    screen: screenId,
    status: { $in: ['upcoming', 'active'] }, // Only check against active or upcoming bookings
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } }, // New booking starts within an existing one
      { endTime: { $gt: startTime, $lte: endTime } },   // New booking ends within an existing one
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } } // New booking encapsulates an existing one
    ]
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId }; // Useful when updating an existing booking
  }
  return this.find(query);
};


const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;