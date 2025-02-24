const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

// User registration with admin creation logic
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role, adminSecret } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // If role is ADMIN, check extra conditions:
    if (role === "ADMIN") {
      // Option 1: Prevent multiple admins by checking if one already exists
      const adminExists = await User.findOne({ userRole: "ADMIN" });
      if (adminExists) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Option 2 (optional): Require a valid admin secret to register as an admin
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Not authorized to register as admin" });
      }
    }

    // Create the new user. The password will be hashed via the pre-save middleware in the model.
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      userRole: role || "STUDENT"
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User login using Mongoose
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Logout (optional – client typically handles token removal)
exports.logout = (req, res) => {
  res.json({ message: "Logout successful" });
};
