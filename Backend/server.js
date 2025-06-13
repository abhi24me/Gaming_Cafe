
// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const path = require('path'); // For serving static files if you save uploads locally

// --- ADD THIS FOR SEEDING ---
const seedScreens = require('./seeders/screenSeeder');
// --- END SEEDING IMPORT ---

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- If saving uploads to disk and want to serve them statically (Example) ---
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Import API routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const screenRoutes = require('./routes/screenRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // <--- ADD THIS

// Use API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/bookings', bookingRoutes); // <--- ADD THIS


// Simple Route for testing
app.get('/', (req, res) => {
  res.send('WelloSphere Backend API is running!');
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // --- CALL SEEDER FUNCTION HERE ---
    // You might want to make this conditional, e.g., only run in development
    // if (process.env.NODE_ENV === 'development') {
    //   seedScreens();
    // }
    // seedScreens(); // Call unconditionally for now for simplicity
    // --- END SEEDER CALL ---

  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Basic error handling
app.use((err, req, res, next) => {
  // Multer error handling (example)
  // if (err instanceof multer.MulterError) {
  //   return res.status(400).json({ message: err.message });
  // } else if (err) {
  //    // Check if it's our custom "Not an image" error from fileFilter
  //    if (err.message === 'Not an image! Please upload an image.') {
  //        return res.status(400).json({ message: err.message });
  //    }
  // }
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' }); // More generic message for other errors
});

