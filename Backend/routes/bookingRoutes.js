
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private (requires user to be logged in)
router.post('/', protect, bookingController.createBooking);

// @route   GET api/bookings
// @desc    Get bookings for the logged-in user
// @access  Private
router.get('/', protect, bookingController.getUserBookings);

// @route   PUT api/bookings/:bookingId/cancel
// @desc    Cancel an upcoming booking
// @access  Private
// router.put('/:bookingId/cancel', protect, bookingController.cancelBooking); // Future implementation

// @route   GET api/bookings
// @desc    Get bookings for the logged-in user
// @access  Private
router.get('/', protect, bookingController.getUserBookings); // <--- THIS IS THE RELEVANT ROUTE

module.exports = router;
