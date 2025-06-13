const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Only needed here if not using user.comparePassword, but good to have if extending

// Helper function to generate JWT
const generateToken = (userId, gamerTag) => {
  return jwt.sign(
    { id: userId, gamerTag: gamerTag },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Token expires in 30 days
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signupUser = async (req, res) => {
  const { gamerTag, email, password, phoneNumber } = req.body;

  try {
    // Basic validation (more comprehensive validation is in the Mongoose model)
    if (!gamerTag || !email || !password) {
      return res.status(400).json({ message: 'Please provide Gamer Tag, email, and password' });
    }

    // Check if user already exists (by email or gamerTag)
    let user = await User.findOne({ $or: [{ email }, { gamerTag }] });
    if (user) {
      let existingField = user.email === email ? 'Email' : 'Gamer Tag';
      return res.status(400).json({ message: `${existingField} already exists` });
    }

    // Create new user instance (password will be hashed by pre-save hook in User model)
    user = new User({
      gamerTag,
      email,
      password,
      phoneNumber // Optional, will be undefined if not provided
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.gamerTag);

    // Respond with token and user info (excluding password)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        gamerTag: user.gamerTag,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    // Handle Mongoose validation errors or other errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body; // Assuming login with email

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email and explicitly select the password (since it's `select: false` in schema)
    // You could also allow login by gamerTag: User.findOne({ $or: [{ email }, { gamerTag: email }] }).select('+password');
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password incorrect)' });
    }

    // Generate token
    const token = generateToken(user._id, user.gamerTag);

    // Respond with token and user info (excluding password)
    res.status(200).json({
      token,
      user: {
        id: user._id,
        gamerTag: user.gamerTag,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};