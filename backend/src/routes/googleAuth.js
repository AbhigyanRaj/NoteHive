const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://note-hive-fawn.vercel.app' 
      : 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://note-hive-fawn.vercel.app' 
      : 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/error?message=Google OAuth not configured`);
  }
  
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://note-hive-fawn.vercel.app' 
        : 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/error`);
    }
    
    req.user = user;
    next();
  })(req, res, next);
}, (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://note-hive-fawn.vercel.app' 
        : 'http://localhost:5173';
      
      const redirectUrl = `${frontendUrl}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }))}`;
      
      console.log('🔄 Google OAuth Success - Redirecting to:', redirectUrl);
      console.log('👤 User authenticated:', req.user.name, req.user.email);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://note-hive-fawn.vercel.app' 
        : 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }
);

module.exports = router;
