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
  // Vapi specific fields
  vapiCallId: {
    type: String,
    unique: true,
    sparse: true
  },
  transcript: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  report: {
    type: Object,
    default: {}
  },
  overallScore: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  questions: [{
    question: String,
    userAnswer: String,
    feedback: String,
    score: Number
  }],
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);