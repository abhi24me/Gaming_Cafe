const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for a transaction']
  },
  type: {
    type: String,
    enum: ['top-up', 'booking-fee', 'refund', 'loyalty-reward', 'admin-adjustment'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required']
    // Positive for top-up, refund, loyalty-reward, positive admin-adjustment
    // Negative for booking-fee, negative admin-adjustment
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Transaction description is required']
  },
  // Link to a specific booking if the transaction is related to one
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  // Link to the TopUpRequest if this transaction resulted from an approved request
  relatedTopUpRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopUpRequest',
    default: null
  },
  walletBalanceBefore: {
    type: Number,
    required: [true, 'Wallet balance before transaction is required']
  },
  walletBalanceAfter: {
    type: Number,
    required: [true, 'Wallet balance after transaction is required']
  },
  loyaltyPointsChange: {
    type: Number,
    default: 0
  },
  loyaltyPointsBalanceBefore: {
    type: Number,
    // Make this conditional or handle cases where loyalty might not apply (e.g. initial setup)
    // required: true
  },
  loyaltyPointsBalanceAfter: {
    type: Number,
    // required: true
  },
  // Additional details, like who performed an admin adjustment
  performedBy: { // Could be an admin user ID
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.index({ user: 1, timestamp: -1 });
transactionSchema.index({ type: 1, timestamp: -1 });
transactionSchema.index({ relatedBooking: 1 });
transactionSchema.index({ relatedTopUpRequest: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;