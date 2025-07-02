// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const seedScreens = require("./seeders/screenSeeder"); // Comment out for Vercel deployment

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  "https://www.trongaming.in",
  "https://tron-gaming-admin-frontend.vercel.app",
  "https://tron-gaming-frontend-git-user-amalfeature-trongamings-projects.vercel.app",
  "http://192.168.1.13:9002",
  "http://localhost:9002",
  "http://localhost:3000",
  "https://gaming-cafe-admin-frontend.vercel.app",
  "https://gaming-cafe-frontend.vercel.app",
  "https://tron-gaming-admin-frontend-git-main-trongamings-projects.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
      callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const adminRoutes = require("./routes/adminRoutes");
const screenRoutes = require("./routes/screenRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/bookings", bookingRoutes);

// Simple root handler for Vercel to check if the app is alive
app.get("/", (req, res) => {
  res.send("Tron Gaming Backend API is running!");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.name, err.message, err.stack);
  if (
    err.message &&
    err.message.startsWith(
      "The CORS policy for this site does not allow access"
    )
  ) {
    return res.status(403).json({ message: err.message });
  }
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server.",
  });
});

// --- Database Connection for Serverless ---
let conn = null;
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env");
  // For local development, if MONGO_URI is not set, we might want to prevent the server from trying to start
  // or at least make it clear it won't connect to a DB.
}

async function connectMongo() {
  if (conn == null && MONGODB_URI) {
    console.log("Attempting to connect to MongoDB...");
    conn = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log("Successfully connected to MongoDB.");
        seedScreens(); // Best to run seeding locally or via a separate script for deployment
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("Database connection error:", err);
        conn = null;
        throw err;
      });
    await conn;
  } else if (!MONGODB_URI) {
    console.warn(
      "MongoDB URI not provided, DB connection skipped for this instance."
    );
  }
  return conn;
}

const PORT = process.env.PORT || 5000;

// Start server for local development if not in Vercel environment
if (
  process.env.VERCEL_ENV !== "production" &&
  process.env.VERCEL_ENV !== "preview" &&
  process.env.VERCEL_ENV !== "development"
) {
  (async () => {
    try {
      if (MONGODB_URI) {
        await connectMongo();
      }
      app.listen(PORT, () => {
        console.log(
          `Backend server running locally on http://localhost:${PORT}`
        );
      });
    } catch (error) {
      console.error("Failed to start local server:", error);
      process.exit(1); // Exit if local server can't start (e.g., DB connection failed critically)
    }
  })();
}

// Export the app for Vercel
module.exports = async (req, res) => {
  try {
    if (MONGODB_URI) {
      await connectMongo();
    }
    app(req, res);
  } catch (error) {
    console.error(
      "Vercel Handler error (DB connection or app processing):",
      error
    );
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Internal Server Error. Please check server logs." });
    }
  }
};
