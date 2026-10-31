const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { UNI_EMAIL_REGEX, UNI_EMAIL_DOMAIN } = require("../utils/constants");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  indexNumber: user.indexNumber,
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, indexNumber, email, password } = req.body;

    if (!name || !indexNumber || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!UNI_EMAIL_REGEX.test(cleanEmail)) {
      return res
        .status(400)
        .json({ message: `Please use your university email (xxxxxxxx${UNI_EMAIL_DOMAIN})` });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const cleanIndex = String(indexNumber).trim().toUpperCase();
    const exists = await User.findOne({
      $or: [{ email: cleanEmail }, { indexNumber: cleanIndex }],
    });
    if (exists) {
      return res.status(400).json({ message: "Email or index number already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      indexNumber: cleanIndex,
      email: cleanEmail,
      password: hashed,
    });

    res.status(201).json({ token: createToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    res.json({ token: createToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protected)
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// POST /api/auth/forgot-password   body: { "email": "..." }
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Email register wela da kiyala eliyata kiyanne nae
    const response = { message: "If that email is registered, a reset link has been sent." };

    const user = await User.findOne({ email });
    if (!user) return res.json(response);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // minutes 15
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "StudyMate password reset",
        text: `Use this link to reset your password (valid for 15 minutes):\n${resetUrl}`,
        html: `<p>Use this link to reset your StudyMate password (valid for 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password/:token   body: { "password": "..." }
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};