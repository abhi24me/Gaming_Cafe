const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware'); // To ensure only logged-in users can make requests

// --- MULTER SETUP (Conceptual - you'd configure this properly) ---
// const multer = require('multer');
// const path = require('path');

// // Configure storage for uploaded receipts (example: saving to disk)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/receipts/'); // Ensure 'uploads/receipts/' directory exists
//   },
//   filename: function (req, file, cb) {
//     cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname)); // Unique filename
//   }
// });

// // File filter for images
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Not an image! Please upload an image.'), false);
//   }
// };

// const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } }); // 5MB limit
// --- END OF MULTER SETUP CONCEPT ---

// @route   POST api/wallet/request-topup
// @desc    User submits a top-up request with payment details and receipt
// @access  Private (requires user to be logged in)
// router.post('/request-topup', protect, upload.single('receiptImage'), walletController.submitTopUpRequest);
// For now, without actual multer setup, let's assume receiptImageUrl is sent in body
router.post('/request-topup', protect, walletController.submitTopUpRequest);


// @route   GET api/wallet/balance
// @desc    Get current user's wallet balance
// @access  Private
router.get('/balance', protect, walletController.getWalletBalance);

// @route   GET api/wallet/transactions
// @desc    Get current user's transaction history
// @access  Private
router.get('/transactions', protect, walletController.getTransactionHistory);

// @route   GET api/wallet/topup-requests
// @desc    Get current user's top-up request history
// @access  Private
router.get('/topup-requests', protect, walletController.getUserTopUpRequests);

router.get('/details', protect, walletController.getWalletDetails);


module.exports = router;