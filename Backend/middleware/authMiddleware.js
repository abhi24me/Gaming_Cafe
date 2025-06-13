const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is in ../models/User

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers (common practice: Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token_string>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token's payload (we stored user ID in the token)
      // Exclude password when fetching user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification error:', error);
      // Handle different JWT errors specifically if needed
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, token failed (invalid signature)' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Optional: Middleware to check for admin roles (if you implement roles later)
// const admin = (req, res, next) => {
//   if (req.user && req.user.isAdmin) { // Assuming you add an 'isAdmin' field to your User model
//     next();
//   } else {
//     res.status(403).json({ message: 'Not authorized as an admin' });
//   }
// };

module.exports = { protect /*, admin */ };