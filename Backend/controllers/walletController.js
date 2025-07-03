
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const TopUpRequest = require("../models/TopUpRequest");
const Admin = require("../models/Admin");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");


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

  // Check for production email credentials first (using environment variables)
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
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  } else {
    // Fallback to Ethereal Email for development/testing if no production config is set
    try {
      let testAccount = await nodemailer.createTestAccount();
      nodemailerTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // Ethereal user
          pass: testAccount.pass, // Ethereal password
        },
      });
      console.log(
        "Using Ethereal Email transporter for testing. Preview URL for emails will be logged."
      );
    } catch (err) {
      console.error(
        "Failed to create Ethereal test account or transporter:",
        err.message
      );
      // If Ethereal fails, set a dummy transporter to prevent crashes, but log that emails won't be sent.
      nodemailerTransporter = {
        sendMail: () => Promise.reject(new Error("Email transporter not configured due to setup failure.")),
        verify: () => Promise.reject(new Error("Ethereal transporter setup failed verification."))
      };
       console.error("Email notifications will not be sent as Ethereal transporter setup failed.");
    }
  }
  return nodemailerTransporter;
}

// Function to send email notification to admins
async function sendAdminTopUpNotification(topUpRequest, userRequesting) {
  try {
    const transporter = await getEmailTransporter();
    
    const adminsToNotify = await Admin.find({
      email: { $ne: null, $exists: true },
    }).select("email username");

    if (adminsToNotify.length === 0) {
      console.log(
        "New top-up request submitted, but no admins found with registered email addresses for notification."
      );
      return;
    }

    const adminEmails = adminsToNotify.map((admin) => admin.email);
    const subject = `New Top-Up Request: ₹${topUpRequest.amount} from ${userRequesting.gamerTag}`;
    const textBody = `A new top-up request has been submitted:
    User: ${userRequesting.gamerTag}
    Amount: ₹${topUpRequest.amount}
    Request ID: ${topUpRequest._id.toString()}
    Payment Method: ${topUpRequest.paymentMethod}
    Please review it in the admin panel.`;
    const htmlBody = `
      <p>A new top-up request has been submitted:</p>
      <ul>
        <li><strong>User:</strong> ${userRequesting.gamerTag}</li>
        <li><strong>Amount:</strong> ₹${topUpRequest.amount}</li>
        <li><strong>Request ID:</strong> ${topUpRequest._id.toString()}</li>
        <li><strong>Payment Method:</strong> ${topUpRequest.paymentMethod}</li>
      </ul>
      <p>Please review it in the WelloSphere admin panel.</p>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER || '"WelloSphere Notifications" <noreply@wellosphere.example.com>', // Sender address (use SMTP_USER or a default for Ethereal)
      to: adminEmails.join(", "), // List of receivers
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent: %s", info.messageId);
    // For Ethereal, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(
        "Preview URL (Ethereal): %s",
        nodemailer.getTestMessageUrl(info)
      );
    }
  } catch (error) {
    console.error("Error sending admin notification email:", error.message);
    // Do not fail the main request if email notification fails
  }
}

exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const confirmedTransactions = await Transaction.find({ user: userId })
      .select("-receiptData")
      .lean();

    const userTopUpRequests = await TopUpRequest.find({
      user: userId,
      status: { $in: ["pending", "rejected"] },
    })
      .select("-receiptData")
      .lean();

    const transformedRequests = userTopUpRequests.map((req) => ({
      _id: req._id.toString(),
      type: "topup-request",
      amount: req.amount,
      description: `Top-Up Request (Status: ${req.status})${
        req.status === "rejected" && req.adminNotes
          ? ` - Reason: ${req.adminNotes}`
          : ""
      }`,
      timestamp: req.requestedAt.toISOString(),
      status: req.status,
      adminNotes: req.adminNotes,
      user: req.user,
    }));

    const allItems = [...confirmedTransactions, ...transformedRequests];
    allItems.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.status(200).json(allItems);
  } catch (error) {
    console.error("Get Wallet Transactions Error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching transactions." });
  }
};

exports.getWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "walletBalance loyaltyPoints"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      balance: user.walletBalance,
      loyaltyPoints: user.loyaltyPoints,
    });
  } catch (error) {
    console.error("Get Wallet Details Error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching wallet details." });
  }
};

exports.requestTopUp = async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!amount) {
    return res.status(400).json({ message: "Amount is required." });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Payment receipt image is required." });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: "Invalid top-up amount." });
  }

  try {
    const userRequesting = await User.findById(userId).select("gamerTag");
    if (!userRequesting) {
      return res
        .status(404)
        .json({ message: "User submitting request not found." });
    }

    const newTopUpRequest = new TopUpRequest({
      user: userId,
      amount: numericAmount,
      paymentMethod: paymentMethod || "UPI",
      receiptData: req.file.buffer,
      receiptMimeType: req.file.mimetype,
      status: "pending",
      requestedAt: new Date(),
    });

    await newTopUpRequest.save();

    // Send email notification to admins
    await sendAdminTopUpNotification(newTopUpRequest, userRequesting);

    res.status(201).json({
      message:
        "Top-up request submitted successfully. It will be reviewed by an admin.",
      request: {
        _id: newTopUpRequest._id,
        amount: newTopUpRequest.amount,
        status: newTopUpRequest.status,
        requestedAt: newTopUpRequest.requestedAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("Request Top-Up Error:", error);
    res
      .status(500)
      .json({ message: "Server error while submitting top-up request." });
  }
};

exports.redeemLoyaltyPoints = async (req, res) => {
  const userId = req.user.id;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found.' });
    }

    const pointsToRedeem = user.loyaltyPoints;
    if (pointsToRedeem < 100) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'A minimum of 100 loyalty points is required to redeem.' });
    }

    const amountToRedeem = pointsToRedeem; // 1 point = 1 Rupee

    const walletBalanceBefore = user.walletBalance;
    const loyaltyPointsBalanceBefore = user.loyaltyPoints;

    user.walletBalance += amountToRedeem;
    user.loyaltyPoints = 0; // Reset points after redemption
    await user.save({ session });
    
    const newTransaction = new Transaction({
      user: userId,
      type: 'loyalty-redemption',
      amount: amountToRedeem,
      description: `Redeemed ${pointsToRedeem} loyalty points for wallet credit.`,
      walletBalanceBefore: walletBalanceBefore,
      walletBalanceAfter: user.walletBalance,
      loyaltyPointsChange: -pointsToRedeem,
      loyaltyPointsBalanceBefore: loyaltyPointsBalanceBefore,
      loyaltyPointsBalanceAfter: user.loyaltyPoints,
      timestamp: new Date()
    });
    await newTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
        message: `Successfully redeemed ${pointsToRedeem} points.`,
        redeemedAmount: amountToRedeem
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Redeem Loyalty Points Error:', error);
    res.status(500).json({ message: 'Server error while redeeming loyalty points.' });
  }
};
