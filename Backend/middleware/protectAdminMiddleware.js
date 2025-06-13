
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use JWT_SECRET or a dedicated JWT_ADMIN_SECRET

      // Ensure it's an admin token if you add specific claims, e.g. decoded.isAdminToken
      // For now, finding an Admin user by ID is sufficient if tokens are distinct enough
      // or if admin actions are only on admin routes.

      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }
      // Optional: Check if the token has a specific claim like `isAdminToken: true`
      // if (!decoded.isAdminToken) {
      //   return res.status(401).json({ message: 'Not authorized, not an admin token' });
      // }


      next();
    } catch (error) {
      console.error('Admin token verification error:', error.name, error.message);
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

module.exports = { protectAdmin };
