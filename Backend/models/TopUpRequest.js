const mongoose = require('mongoose');

const topUpRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for a top-up request']
  },
  amount: {
    type: Number,
    required: [true, 'Requested amount is required'],
    min: [1, 'Amount must be at least 1'] // Assuming a minimum top-up amount
  },
  // User-provided UPI transaction ID / reference number from their payment app
  upiTransactionId: {
    type: String,
    required: [true, 'UPI transaction ID is required'],
    trim: true
  },
  // URL or path to the uploaded receipt image.
  // Actual file upload handling will be done in the controller/service layer.
  receiptImageUrl: {
    type: String,
    required: [true, 'Receipt image URL is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  adminNotes: { // Notes from admin during review (e.g., reason for rejection)
    type: String,
    trim: true
  },
  reviewedBy: { // Reference to the admin User who reviewed this (if you have admin roles)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Or an 'Admin' model if you have one
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  // This field will link to the actual transaction created upon approval
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }
});

// Indexes
topUpRequestSchema.index({ user: 1, status: 1, requestedAt: -1 }); // For fetching user's requests or admin's pending list
topUpRequestSchema.index({ status: 1, requestedAt: -1 }); // For admins to fetch all pending requests

const TopUpRequest = mongoose.model('TopUpRequest', topUpRequestSchema);

module.exports = TopUpRequest;