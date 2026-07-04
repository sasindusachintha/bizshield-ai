const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    language: user.language || "en",
    currency: user.currency || "USD",
  };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userPayload(user),
      },
    });
  } catch (error) {
    console.error("register error:", error);
    res.status(500).json({ success: false, error: error.message || "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: userPayload(user),
      },
    });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ success: false, error: error.message || "Login failed" });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateSettings(req, res) {
  try {
    const { name, email, password, language, currency } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (language && ["en", "si"].includes(language)) user.language = language;
    if (currency && ["LKR", "USD", "EUR", "GBP", "INR"].includes(currency)) user.currency = currency;
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      user.password = password;
    }

    await user.save();
    res.json({ success: true, data: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { register, login, getMe, updateSettings };
