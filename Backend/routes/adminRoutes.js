
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/protectAdminMiddleware'); // New middleware for admin sessions

// --- Admin Login Route (Public) ---
// @route   POST api/admin/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', adminController.loginAdmin);


// --- Protected Admin Routes ---
// All routes below this will be protected by the protectAdmin middleware
// which verifies the token issued from /api/admin/login.
router.use(protectAdmin);

// @route   GET api/admin/topup-requests/pending
// @desc    Admin gets a list of all pending top-up requests
// @access  Admin
router.get('/topup-requests/pending', adminController.getPendingTopUpRequests);

// @route   GET api/admin/topup-requests/history
// @desc    Admin gets a history of all top-up requests
// @access  Admin
router.get('/topup-requests/history', adminController.getTopUpRequestHistory);

// @route   PUT api/admin/topup-requests/:requestId/approve
// @desc    Admin approves a top-up request
// @access  Admin
router.put('/topup-requests/:requestId/approve', adminController.approveTopUpRequest);

// @route   PUT api/admin/topup-requests/:requestId/reject
// @desc    Admin rejects a top-up request
// @access  Admin
router.put('/topup-requests/:requestId/reject', adminController.rejectTopUpRequest);

module.exports = router;
    