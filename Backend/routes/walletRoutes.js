
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
// path and fs are no longer needed here as we are not saving to disk

// Multer configuration for receipt uploads (using memory storage)
const storage = multer.memoryStorage(); // Store files in memory as Buffers

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file (jpeg, png, webp).'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use(protect);

router.get('/transactions', walletController.getWalletTransactions);
router.get('/details', walletController.getWalletDetails);

router.post('/request-topup', upload.single('receipt'), walletController.requestTopUp);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    if (err.message.startsWith('Not an image!')) {
        return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
  next();
});

module.exports = router;
