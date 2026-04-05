const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  personality: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  questions: [{
    question: String,
    userAnswer: String,
    feedback: String,
    score: Number
  }],
  report: {
    overallScore: Number,
    strengths: [String],
    improvements: [String],
    recommendations: String
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);