const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');

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

// ✅ ADD VAPI WEBHOOK ROUTE
app.use('/webhook', require('./routes/vapiWebhook'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});