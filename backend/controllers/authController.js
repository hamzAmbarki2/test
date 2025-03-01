const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://mon-app.com' : 'http://localhost:5173';

const PasswordResetToken = require('../models/PasswordResetToken');
const Verifyemail = require('../models/VerifyEmailToken');


const invalidatedTokens = new Set();

// Enregistrement d'un utilisateur avec création d'admin et envoi d'un email de vérification
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role, adminSecret } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Si le rôle est ADMIN, vérifier les conditions supplémentaires
    if (role === "ADMIN") {
      // Option 1: Empêcher plusieurs admins
      const adminExists = await User.findOne({ userRole: "ADMIN" });
      if (adminExists) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Option 2: Exiger un adminSecret valide
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Not authorized to register as admin" });
      }
    }

    // Créer le nouvel utilisateur (le mot de passe sera haché via le middleware pre-save)
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      userRole: role || "STUDENT"
    });
    
    // Générer un token de vérification d'email
    const generatedToken = crypto.randomBytes(32).toString('hex');
    const newToken = new Verifyemail({
      token: generatedToken,
      email: email,
      expiresAt: Date.now() + 3600000 // expire dans 1 heure
    });
    await newToken.save();

    // Configurer le transporteur Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'Firdaous.JEBRI@esprit.tn',
        pass: 'xwbcgpyxnwghflrk'
      },
      tls: { rejectUnauthorized: false }
    });

    // Options de l'email de vérification
    const mailOptions = {
      from: 'Firdaous.JEBRI@esprit.tn',
      to: email,
      subject: 'Email Verification',
      html: `<h1>Email Verification</h1>
             <p>Please verify your email by clicking the link below:</p>
             <a href="${BASE_URL}/verify-email/${generatedToken}">Verify Email</a>`
    };

    // Envoyer l'email de manière asynchrone
    await transporter.sendMail(mailOptions);
    
    await user.save();


    // Envoyer une seule réponse après toutes les opérations
    res.status(201).json({ message: "User registered successfully. Verification email sent.", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Vérification de l'email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params; // le token doit être passé dans l'URL, ex: /verify-email/:token

  try {
    // Vérifier si le token de vérification est valide et non expiré
    const emailToken = await Verifyemail.findOne({ token });
    if (!emailToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    if (emailToken.expiresAt < Date.now()) {
      return res.status(400).json({ message: "The token has expired" });
    }

    // Trouver l'utilisateur correspondant au token
    const user = await User.findOne({ email: emailToken.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Mettre à jour le champ isVerified de l'utilisateur
    user.isVerified = true;
    await user.save();

    // Supprimer le token de vérification après utilisation
    await Verifyemail.deleteOne({ token });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Connexion de l'utilisateur avec gestion de session
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the account is locked
    if (user.accountStatus === false) {
      return res.status(403).json({ message: "Account locked ! Contact the administrator." });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Account not verified! Check your email." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment failed attempts counter
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      console.log(user.failedAttempts);
      
      // If 5 failures, lock the account
      if (user.failedAttempts >= 5) {
        user.accountStatus = false;
      }

      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Reset failed attempts counter after successful login
    user.failedAttempts = 0;
    await user.save();
    console.log(user.failedAttempts);

    // Create a JWT token (if needed)
    const token = generateToken(user);

    // Create a session for the user
    req.session.userId = user._id;
    req.session.userRole = user.userRole;

    res.json({ message: "Login successful", token, session: req.session });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Deconnexion
exports.logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Add token to invalidated set
      invalidatedTokens.add(token);
    }

    // Clear session
    if (req.session) {
      req.session.destroy();
    }

    // Clear cookies with proper options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict'
    });

    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict'
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Error while logging out" });
  }
};

// Middleware to check authentication
exports.checkTokenValidity = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // No token provided
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if token is invalidated
    if (invalidatedTokens.has(token)) {
      return res.status(401).json({ message: "Session expired" });
    }

    // Check session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Invalid session" });
    }

    next();
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ message: "Authentication error" });
  }
};

// Demande de réinitialisation de mot de passe
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const generatedToken = crypto.randomBytes(32).toString('hex');
    const newToken = new PasswordResetToken({
      token: generatedToken,
      email: email,
      expiresAt: Date.now() + 3600000
    });

    await newToken.save();

    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'Firdaous.JEBRI@esprit.tn',
        pass: 'xwbcgpyxnwghflrk'
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: 'Firdaous.JEBRI@esprit.tn',
      to: email,
      subject: 'Password Reset Request',
      html: `<h1>Resetting your password</h1><p>You have requested a password reset. Click this link to reset your password:</p><a href="${BASE_URL}/reset-password/${generatedToken}">Reset Password</a> <p>If you have not requested this, please ignore this email.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred:', error);
        return res.status(500).json({ message: 'Error sending the password reset email', error: error.message });
      } else {
        res.status(200).json({ message: 'Password reset link sent.' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing the password reset request', error: error.message });
  }
};

// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Vérifier si le token de réinitialisation est valide et non expiré
    const passwordResetToken = await PasswordResetToken.findOne({ token });
    if (!passwordResetToken) return res.status(400).json({ message: "Invalid or expired token" });
    if (passwordResetToken.expiresAt < Date.now()) return res.status(400).json({ message: "The token has expired" });

    // Trouver l'utilisateur correspondant au token de réinitialisation
    const user = await User.findOne({ email: passwordResetToken.email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔹 Hachage du nouveau mot de passe avec la méthode du modèle (via le middleware `pre-save`)
    user.password = newPassword;

    // Sauvegarder l'utilisateur avec le mot de passe haché
    await user.save();

    // Supprimer le token de réinitialisation après utilisation
    await PasswordResetToken.deleteOne({ token });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};
