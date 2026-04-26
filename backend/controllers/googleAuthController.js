const { google } = require('googleapis');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Initiate Google OAuth flow
// @route   GET /api/auth/google
// @access  Public
const initiateGoogleAuth = async (req, res) => {
  try {
    // Generate authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });

    res.json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Google authentication'
    });
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_code`);
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    const { id, email, name, picture } = data;

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_email`);
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (user.status === 'suspended') {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=account_suspended`);
      }
      // User exists - update Google ID and avatar if not set
      if (!user.googleId) {
        user.googleId = id;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      // Create new user with Google OAuth
      user = await User.create({
        name,
        email,
        googleId: id,
        avatar: picture,
        authProvider: 'google',
        role: 'user' // Default role for new users
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&message=Signed in with Google successfully!`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback
};
