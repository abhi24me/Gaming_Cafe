const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Screen name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // You can expand this based on your needs, e.g., type of console, display specs, etc.
  features: [{
    type: String,
    trim: true
  }],
  // This could represent what's currently displayed in your Next.js frontend
  // For the backend, these might be stored if you allow admins to update them,
  // or they could be derived/managed differently.
  imagePlaceholderUrl: {
    type: String,
    trim: true
  },
  imageAiHint: { // Corresponds to data-ai-hint in your frontend for image suggestions
    type: String,
    trim: true
  },
  // To allow admins to temporarily disable a screen for maintenance, etc.
  isActive: {
    type: Boolean,
    default: true
  },
  // You might want to add hourly rates or link to a pricing model here
  // hourlyRate: {
  //   type: Number,
  //   required: [true, 'Hourly rate is required']
  // },
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
screenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Screen = mongoose.model('Screen', screenSchema);

module.exports = Screen;