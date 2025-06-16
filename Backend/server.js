
// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// const seedScreens = require('./seeders/screenSeeder'); // Comment out for Vercel deployment

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3001',
  'https://gaming-cafe-frontend-mpidfizf7.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you need to send cookies or authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (if any are saved to disk and need to be public)
// For example, if user profile pictures or screen images were uploaded
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  if (err.message && err.message.startsWith('The CORS policy for this site does not allow access')) {
    return res.status(403).json({ message: err.message });
  }
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
}

async function connectMongo() {
  if (conn == null && MONGODB_URI) {
    console.log('Attempting to connect to MongoDB...');
    conn = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    }).then((mongooseInstance) => {
      console.log('Successfully connected to MongoDB.');
      // seedScreens(); // Best to run seeding locally or via a separate script
      return mongooseInstance;
    }).catch(err => {
      console.error('Database connection error:', err);
      conn = null;
      throw err;
    });
    await conn;
  } else if (!MONGODB_URI) {
    console.warn("MongoDB URI not provided, DB connection skipped for this instance.");
  }
  return conn;
}

module.exports = async (req, res) => {
  try {
    if (MONGODB_URI) {
      await connectMongo();
    } else {
       // If it's an API route that needs DB, it will fail later.
    }
    app(req, res);
  } catch (error) {
    console.error("Handler error (DB connection or app processing):", error);
    res.status(500).json({ message: "Internal Server Error. Please check server logs." });
  }
};
