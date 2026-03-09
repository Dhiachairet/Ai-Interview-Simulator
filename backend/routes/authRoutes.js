const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { initiateGoogleAuth, handleGoogleCallback } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
