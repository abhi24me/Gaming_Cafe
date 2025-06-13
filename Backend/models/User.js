const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  gamerTag: {
    type: String,
    required: [true, 'Gamer Tag is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Gamer Tag must be at least 3 characters long'],
    maxlength: [20, 'Gamer Tag cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phoneNumber: { // Kept as optional for now, can be made required if needed
    type: String,
    trim: true,
    // You might want to add a regex for phone number validation if it becomes mandatory
    // match: [/^\+\d{10,15}$/, 'Please fill a valid phone number (e.g., +91XXXXXXXXXX)']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Password will not be returned in queries by default
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0 // You might initialize this differently, e.g., upon first top-up
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

// Middleware to hash password before saving a new user
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  // Hash the password with cost of 12
  const salt = await bcrypt.genSalt(10); // Salt rounds, 10-12 is common
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Middleware to update `updatedAt` field on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare candidate password with the user's hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;