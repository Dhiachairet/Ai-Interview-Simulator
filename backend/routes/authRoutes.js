const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { initiateGoogleAuth, handleGoogleCallback } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Protected routes
router.get('/me', protect, getMe);

// ✅ Update profile (name and email)
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }
    
    const user = await User.findById(req.user.id);
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Update password
router.put('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;