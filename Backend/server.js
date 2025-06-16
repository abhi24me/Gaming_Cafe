
// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// path is no longer needed here for serving static uploads for receipts
const seedScreens = require('./seeders/screenSeeder');

const bcrypt = require('bcryptjs');

async function generateHash() {
  const plainPassword = '1234567890'; // <-- REPLACE THIS
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  console.log('--- Admin Password Hash ---');
  console.log('Username:', 'your_chosen_username'); // Reminder for yourself
  console.log('Plain Password (for reference, DONT USE IN DB):', plainPassword);
  console.log('BCRYPT HASH (use this in MongoDB):', hashedPassword);
  console.log('---------------------------');
}

generateHash(); // Call the function
// END OF TEMPORARY CODE

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for '/uploads' is removed as images are stored in DB

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

app.get('/', (req, res) => {
  res.send('WelloSphere Backend API is running!');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    seedScreens();
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.name, err.message, err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
     message: err.message || 'An unexpected error occurred on the server.'
  });
});
