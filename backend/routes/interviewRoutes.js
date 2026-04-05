const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateQuestion, evaluateAnswer } = require('../services/geminiService');
const Interview = require('../models/Interview');
const { generateSpeech } = require('../services/elevenlabsTTS'); // Updated to use ElevenLabs

// Start interview - create session
router.post('/start', protect, async (req, res) => {
  try {
    const { jobRole, personality, difficulty } = req.body;
    
    const question = await generateQuestion(jobRole, personality, difficulty);
    
    const interview = await Interview.create({
      user: req.user.id,
      jobRole,
      personality,
      difficulty,
      questions: [{ question: question }],
      status: 'in-progress'
    });
    
    res.json({
      success: true,
      interviewId: interview._id,
      question: question,
      questionNumber: 1
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit answer and save to database
router.post('/answer', protect, async (req, res) => {
  try {
    const { 
      interviewId,
      currentQuestion, 
      userAnswer, 
      questionNumber,
      isComplete 
    } = req.body;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }
    
    const evaluation = await evaluateAnswer(
      currentQuestion, 
      userAnswer, 
      interview.jobRole, 
      interview.personality, 
      interview.difficulty
    );
    
    const questionIndex = questionNumber - 1;
    interview.questions[questionIndex].userAnswer = userAnswer;
    interview.questions[questionIndex].feedback = evaluation.feedback;
    interview.questions[questionIndex].score = evaluation.score;
    
    let nextQuestion = null;
    let complete = isComplete || questionNumber >= 5;
    
    if (!complete && questionNumber < 5) {
      nextQuestion = await generateQuestion(
        interview.jobRole, 
        interview.personality, 
        interview.difficulty, 
        userAnswer
      );
      interview.questions.push({ question: nextQuestion });
    } else if (complete) {
      interview.status = 'completed';
      interview.completedAt = new Date();
      
      const totalScore = interview.questions.reduce((sum, q) => sum + (q.score || 0), 0);
      interview.report = {
        overallScore: totalScore / interview.questions.length,
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        recommendations: "Practice more on the areas mentioned above."
      };
    }
    
    await interview.save();
    
    res.json({
      success: true,
      evaluation: evaluation,
      nextQuestion: nextQuestion,
      isComplete: complete
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get interview history for current user
router.get('/history', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id })
      .sort('-createdAt')
      .select('jobRole personality difficulty report status createdAt');
    
    res.json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific interview details
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }
    
    res.json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete interview
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }
    
    await interview.deleteOne();
    res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Text-to-Speech endpoint with ElevenLabs
router.post('/speak', protect, async (req, res) => {
  try {
    const { text, personality, isQuestion } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text provided' });
    }
    
    console.log(`TTS Request - Personality: ${personality}, Question: ${isQuestion}`);
    
    const result = await generateSpeech(text, personality, isQuestion);
    
    if (result.success) {
      res.json({ 
        success: true, 
        audio: result.audio,
        voiceUsed: result.voiceUsed
      });
    } else {
      // Return 200 but with success false so frontend falls back
      res.json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('TTS endpoint error:', error);
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;