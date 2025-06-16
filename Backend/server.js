
// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const seedScreens = require('./seeders/screenSeeder'); // Comment out for Vercel deployment

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const screenRoutes = require('./routes/screenRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/bookings', bookingRoutes);

// Simple root handler for Vercel to check if the app is alive
app.get('/', (req, res) => {
  res.send('WelloSphere Backend API is running on Vercel!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.name, err.message, err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
     message: err.message || 'An unexpected error occurred on the server.'
  });
});

// --- Database Connection for Serverless ---
let conn = null;
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env");
  // In a serverless environment, you might not want to process.exit,
  // but ensure this is logged prominently.
  // Vercel deployment will likely fail if env var is missing.
}

async function connectMongo() {
  if (conn == null && MONGODB_URI) {
    console.log('Attempting to connect to MongoDB...');
    conn = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Optional: Timeout for connection
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
    }).then((mongooseInstance) => {
      console.log('Successfully connected to MongoDB.');
      // seedScreens(); // Best to run seeding locally or via a separate script
      return mongooseInstance;
    }).catch(err => {
      console.error('Database connection error:', err);
      conn = null; // Reset conn on failure so it can retry
      throw err; // Rethrow to signal connection failure
    });
    // `await` the promise to ensure the connection is established or an error is thrown.
    await conn;
  } else if (!MONGODB_URI) {
    console.error("MongoDB URI not provided, skipping connection.");
  }
  return conn;
}

// Export the app for Vercel.
// Vercel expects a default export that is a request handler.
// We wrap the Express app in an async function that ensures DB connection.
module.exports = async (req, res) => {
  try {
    if (MONGODB_URI) { // Only attempt to connect if URI is available
      await connectMongo();
    } else {
      // If no DB URI, and it's an API route that needs DB, it will fail later.
      // Health check routes or static info routes might still work.
      console.warn("MONGODB_URI not set, proceeding without database connection for this request.");
    }
    app(req, res); // Pass request to Express app
  } catch (error) {
    console.error("Handler error (DB connection or app processing):", error);
    // Send a generic error response
    // Avoid sending detailed error stack to client in production
    res.status(500).json({ message: "Internal Server Error. Please check server logs." });
  }
};

// The original app.listen() and direct mongoose.connect() block is removed
// as Vercel handles server listening and the connection is managed above.
