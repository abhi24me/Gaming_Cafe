
const mongoose = require('mongoose');

const priceOverrideSchema = new mongoose.Schema({
  daysOfWeek: { // 0 (Sunday) to 6 (Saturday)
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.every(day => day >= 0 && day <= 6);
      },
      message: 'daysOfWeek must contain numbers between 0 and 6.'
    }
  },
  startTimeUTC: { // "HH:MM" format, e.g., "09:30"
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTimeUTC must be in HH:MM format (UTC).']
  },
  endTimeUTC: {   // "HH:MM" format, e.g., "17:30" (slot must start before this time)
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTimeUTC must be in HH:MM format (UTC).']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative.']
  }
}); // Removed {_id: false} to allow Mongoose to auto-generate _id for subdocuments


const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Screen name is required.'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  features: {
    type: [String],
    default: [],
  },
  imagePlaceholderUrl: {
    type: String,
    required: [true, 'Image placeholder URL is required.'],
    default: 'https://placehold.co/600x400.png',
  },
  imageAiHint: {
    type: String,
    required: [true, 'Image AI hint is required.'],
    default: 'gaming setup',
  },
  basePrice: { // Default price for slots if no override matches
    type: Number,
    required: [true, 'Base price is required for a screen.'],
    default: 100,
    min: [0, 'Base price cannot be negative.']
  },
  priceOverrides: [priceOverrideSchema], // Array of price override rules
  isActive: {
    type: Boolean,
    default: true,
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

// Middleware to update `updatedAt` field on save
screenSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Screen = mongoose.model('Screen', screenSchema);

module.exports = Screen;
