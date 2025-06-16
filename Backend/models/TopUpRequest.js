
const mongoose = require('mongoose');

const topUpRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Top-up amount is required.'],
    min: [1, 'Top-up amount must be at least 1.'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'UPI',
  },
  // Removed upiTransactionId
  // receiptImageUrl and receiptFilename are replaced by receiptData and receiptMimeType
  receiptData: {
    type: Buffer, // Storing the image data directly
    required: [true, 'Receipt image data is required.'],
  },
  receiptMimeType: {
    type: String, // E.g., 'image/jpeg', 'image/png'
    required: [true, 'Receipt image MIME type is required.'],
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewedAt: {
    type: Date,
  },
  adminNotes: {
    type: String,
    trim: true,
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

topUpRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const TopUpRequest = mongoose.model('TopUpRequest', topUpRequestSchema);

module.exports = TopUpRequest;
