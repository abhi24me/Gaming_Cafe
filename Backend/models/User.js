
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  gamerTag: {
    type: String,
    required: [true, 'Gamer Tag is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Gamer Tag must be at least 3 characters long.'],
    maxlength: [20, 'Gamer Tag must be at most 20 characters long.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [8, 'Password must be at least 8 characters long.'],
    select: false, // Don't return password in queries by default
  },
  phoneNumber: {
    type: String,
    trim: true,
    // Example validation, can be more strict if needed
    // match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number.']
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update `updatedAt` field on save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
