const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');

// Validate environment configuration. Missing REQUIRED vars are logged as
// errors; missing OPTIONAL vars only warn so the app never crashes on startup.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const OPTIONAL_ENV = [
  'FRONTEND_URL', 'GEMINI_API_KEY', 'VAPI_PRIVATE_KEY', 'ELEVENLABS_API_KEY',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) console.error(`❌ Missing REQUIRED environment variable: ${key}`);
});
OPTIONAL_ENV.forEach((key) => {
  if (!process.env[key]) console.warn(`⚠️  Optional environment variable not set: ${key} — related features may be unavailable.`);
});

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AI Interview Simulator API is running' });
});

// Mount auth routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));

// Admin routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin', require('./routes/adminVapiRoutes'));

// VAPI WEBHOOK ROUTE
app.use('/webhook', require('./routes/vapiWebhook'));

// ✅ JOB ROUTES - Register BOTH public and admin routes
// Public routes for users (no authentication)
app.use('/api/job-roles', require('./routes/jobRoleRoutes'));

// Admin routes (with authentication) - using the same routes file
// The routes file handles which endpoints require auth
app.use('/api/admin/job-roles', require('./routes/jobRoleRoutes'));

// Resume routes
app.use('/api/resume', require('./routes/resumeRoutes'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});