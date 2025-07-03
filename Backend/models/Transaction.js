
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['top-up', 'booking-fee', 'refund', 'topup-request', 'loyalty-redemption'], // Added 'loyalty-redemption'
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  walletBalanceBefore: {
    type: Number,
  },
  walletBalanceAfter: {
    type: Number,
  },
  loyaltyPointsChange: {
    type: Number,
  },
  loyaltyPointsBalanceBefore: {
    type: Number,
  },
  loyaltyPointsBalanceAfter: {
    type: Number,
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  relatedTopUpRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopUpRequest',
  },
  performedBy: { // Could be a user ID or an admin ID
    type: mongoose.Schema.Types.ObjectId,
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

// Middleware to update `updatedAt` field on save
transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
