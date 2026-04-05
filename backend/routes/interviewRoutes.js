const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateQuestion, evaluateAnswer } = require('../services/geminiService');
const Interview = require('../models/Interview');

// Start interview - create session
router.post('/start', protect, async (req, res) => {
  try {
    const { jobRole, personality, difficulty } = req.body;
    
    const question = await generateQuestion(jobRole, personality, difficulty);
    
    // Create interview session in database
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
    
    // Find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }
    
    // Evaluate the answer
    const evaluation = await evaluateAnswer(
      currentQuestion, 
      userAnswer, 
      interview.jobRole, 
      interview.personality, 
      interview.difficulty
    );
    
    // Update the question with answer and feedback
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
      
      // Calculate overall report
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

module.exports = router;