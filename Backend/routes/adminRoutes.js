
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/protectAdminMiddleware');

// --- Admin Login Route (Public) ---
router.post('/login', adminController.loginAdmin);

// --- Protected Admin Routes ---
router.use(protectAdmin);

// Top-Up Request Management
router.get('/topup-requests/pending', adminController.getPendingTopUpRequests);
router.get('/topup-requests/history', adminController.getTopUpRequestHistory);
router.put('/topup-requests/:requestId/approve', adminController.approveTopUpRequest);
router.put('/topup-requests/:requestId/reject', adminController.rejectTopUpRequest);

// Screen & Pricing Management
router.get('/screens', adminController.getScreensForAdmin);
router.post('/screens/:screenId/overrides', adminController.addScreenPriceOverride);
router.delete('/screens/:screenId/overrides/:overrideId', adminController.removeScreenPriceOverride);
// router.put('/screens/:screenId/base-price', adminController.updateScreenBasePrice); // Future

// Promotions
router.post('/send-promo-email', adminController.sendPromoEmail);

module.exports = router;
