
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- Nodemailer Transporter Setup ---
let nodemailerTransporter;

async function getEmailTransporter() {
  if (nodemailerTransporter) {
    try {
      await nodemailerTransporter.verify();
      return nodemailerTransporter;
    } catch (error) {
      console.warn("Existing email transporter verification failed, re-initializing.", error.message);
      nodemailerTransporter = null;
    }
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    nodemailerTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  if (!nodemailerTransporter) {
    try {
      let testAccount = await nodemailer.createTestAccount();
      nodemailerTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('Using Ethereal Email transporter for testing. Preview URL for emails will be logged.');
    } catch (err) {
      console.error('Failed to create Ethereal test account or transporter:', err.message);
      nodemailerTransporter = {
        sendMail: () => Promise.reject(new Error("Email transporter (Ethereal) not configured due to setup failure.")),
        verify: () => Promise.reject(new Error("Ethereal transporter setup failed verification."))
      };
    }
  }
  return nodemailerTransporter;
}


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(200).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        gamerTag: user.gamerTag,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.signupUser = async (req, res) => {
    const { gamerTag, email, password, phoneNumber } = req.body;
    try {
        const userExists = await User.findOne({ $or: [{ email }, { gamerTag }] });
        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ message: 'User with this email already exists.' });
            }
            if (userExists.gamerTag === gamerTag) {
                return res.status(400).json({ message: 'This Gamer Tag is already taken.' });
            }
        }

        const user = await User.create({
            gamerTag,
            email,
            password,
            phoneNumber,
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    gamerTag: user.gamerTag,
                    email: user.email,
                },
            });
        } else {
            res.status(400).json({ message: 'Invalid user data.' });
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address.' });
  }

  try {
    const user = await User.findOne({ email });
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        await user.save();

        const frontendBaseUrl = process.env.FRONTEND_URL || (process.env.VERCEL_ENV === 'production' ? 'https://gaming-cafe-frontend.vercel.app' : 'http://localhost:9002');
        const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;
        const emailBody = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

        try {
            const transporter = await getEmailTransporter();
            const info = await transporter.sendMail({
                to: user.email,
                from: process.env.SMTP_USER || '"WelloSphere Support" <support@wellosphere.example.com>',
                subject: 'WelloSphere Password Reset Request',
                text: emailBody
            });
            
            console.log(`Password reset email sent to ${user.email}. Preview: ${nodemailer.getTestMessageUrl(info) || 'No preview URL for this transport'}`);

        } catch (err) {
            console.error('Error sending password reset email:', err);
        }
    }
    
    res.status(200).json({ message: successMessage });

  } catch (error) {
    console.error('Forgot Password Server Error:', error);
    res.status(500).json({ message: 'An error occurred on the server.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    // Get user based on the hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    // Set the new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset Password Server Error:', error);
    res.status(500).json({ message: 'An error occurred on the server while resetting the password.' });
  }
};
