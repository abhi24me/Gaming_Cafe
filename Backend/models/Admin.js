
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Admin username is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Admin password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Password will not be returned in queries by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Middleware to hash password before saving a new admin
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Middleware to update `updatedAt` field on save
adminSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare candidate password with the admin's hashed password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
