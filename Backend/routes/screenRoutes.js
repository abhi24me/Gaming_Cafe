
const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// @route   GET api/screens
// @desc    Get all active screens available for booking
// @access  Private (requires user to be logged in)
router.get('/', protect, screenController.listScreens);

// @route   GET api/screens/:screenId/availability
// @desc    Get available time slots for a specific screen on a given date
// @access  Private (requires user to be logged in) - Date should be passed as query param e.g., ?date=YYYY-MM-DD
router.get('/:screenId/availability', protect, screenController.getScreenAvailability);

// You might also want an endpoint to get details of a single screen (if needed and also protected)
// router.get('/:screenId', protect, screenController.getScreenDetails);

module.exports = router;
