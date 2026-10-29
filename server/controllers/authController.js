const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, indexNumber, email, password } = req.body;

    if (!name || !indexNumber || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ $or: [{ email }, { indexNumber }] });
    if (exists) {
      return res.status(400).json({ message: "Email or index number already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, indexNumber, email, password: hashed });

    res.status(201).json({
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, indexNumber: user.indexNumber },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, indexNumber: user.indexNumber },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protected)
exports.getMe = async (req, res) => {
  res.json(req.user);
};