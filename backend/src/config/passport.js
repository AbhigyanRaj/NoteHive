const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

// Clear any existing strategies to avoid conflicts
if (passport._strategies && passport._strategies.google) {
  delete passport._strategies.google;
}

// Only configure Google Strategy if environment variables are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Dynamic callback URL for both development and production
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
  const callbackURL = isProduction
    ? `https://notehive-9176.onrender.com/api/auth/google/callback`
    : `http://localhost:${process.env.PORT || 5001}/api/auth/google/callback`;
  
  console.log('OAuth Config - callbackURL:', callbackURL);
  console.log('OAuth Config - Environment:', process.env.NODE_ENV);
  console.log('OAuth Config - isProduction:', isProduction);

  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0]?.value,
      password: 'google-oauth-user' // Placeholder password for Google users
    });
    
    await user.save();
    done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    done(error, null);
  }
  }));
} else {
  console.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are missing');
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
