const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateQuestion, evaluateAnswer } = require('../services/geminiService');
const Interview = require('../models/Interview');
const { generateSpeech } = require('../services/elevenlabsTTS');

// Start interview - create session (Legacy Gemini mode)
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

// Submit answer and save to database (Legacy Gemini mode)
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

// ✅ SAVE VAPI CALL DATA ENDPOINT - WITH FALLBACK METADATA
router.post('/save-vapi-call', protect, async (req, res) => {
  const { vapiCallId, fallbackMetadata } = req.body;
  
  console.log('📞 Saving Vapi call:', vapiCallId);
  console.log('📋 Fallback metadata received:', fallbackMetadata);
  
  if (!vapiCallId) {
    return res.status(400).json({ success: false, error: 'Missing vapiCallId' });
  }

  try {
    const url = `https://api.vapi.ai/call/${vapiCallId}`;
    
    console.log('Fetching from Vapi API:', url);
    
    const vapiResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error('Vapi API error response:', errorText);
      throw new Error(`Vapi API error: ${vapiResponse.status}`);
    }

    const callData = await vapiResponse.json();
    console.log(`✅ Fetched call ${vapiCallId} from Vapi API`);
    
    // ✅ PRIORITIZE: Use fallbackMetadata from frontend FIRST
    // This is the data we saved locally when the call started
    const jobRole = fallbackMetadata?.jobRole || 
                    callData.variableValues?.jobRole || 
                    'Unknown';
    
    const personality = fallbackMetadata?.personality || 
                        callData.variableValues?.personality || 
                        callData.assistant?.name || 
                        'Unknown';
    
    const difficulty = fallbackMetadata?.difficulty || 
                       callData.variableValues?.difficulty || 
                       'medium';
    
    console.log(`📋 Extracted - Role: ${jobRole}, Personality: ${personality}, Difficulty: ${difficulty}`);
    
    // Extract transcript and analysis (these still come from Vapi API)
    const transcript = callData.artifact?.transcript || '';
    const recordingUrl = callData.artifact?.recordingUrl || '';
    const summary = callData.analysis?.summary || '';
    const structuredData = callData.analysis?.structuredData || {};
    const overallScore = structuredData?.overallScore || 0;
    const strengths = structuredData?.strengths || [];
    const improvements = structuredData?.improvements || [];
    
    // Parse transcript into questions and answers
    const questions = [];
    const lines = transcript.split('\n');
    let currentQuestion = null;
    
    for (const line of lines) {
      if (line.includes('Assistant:') || line.includes('AI:')) {
        currentQuestion = {
          question: line.replace(/Assistant:|AI:/, '').trim(),
          userAnswer: '',
          feedback: '',
          score: 0
        };
        questions.push(currentQuestion);
      } else if ((line.includes('User:') || line.includes('Candidate:')) && currentQuestion) {
        currentQuestion.userAnswer = line.replace(/User:|Candidate:/, '').trim();
      }
    }
    
    // Find or create interview
    let interview = await Interview.findOne({ vapiCallId: vapiCallId });
    
    const interviewData = {
      vapiCallId: vapiCallId,
      jobRole: jobRole,
      personality: personality,
      difficulty: difficulty,
      transcript: transcript,
      summary: summary,
      recordingUrl: recordingUrl,
      questions: questions,
      report: {
        overallScore: overallScore,
        strengths: strengths,
        improvements: improvements,
        fullAnalysis: structuredData
      },
      overallScore: overallScore,
      status: 'completed',
      completedAt: new Date(),
      duration: callData.duration || 0
    };
    
    if (interview) {
      Object.assign(interview, interviewData);
      await interview.save();
      console.log(`✅ Updated interview for call ${vapiCallId}`);
    } else {
      interview = await Interview.create({
        user: req.user.id,
        ...interviewData
      });
      console.log(`✅ Created new interview for call ${vapiCallId}`);
    }
    
    res.json({ success: true, data: interview });
    
  } catch (error) {
    console.error('Error saving Vapi call:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Get interview history for current user
router.get('/history', protect, async (req, res) => {
  try {
    console.log('Fetching history for user:', req.user.id);
    
    const interviews = await Interview.find({ user: req.user.id })
      .sort('-createdAt');
    
    console.log(`Found ${interviews.length} interviews`);
    
    res.json({ 
      success: true, 
      data: interviews,
      count: interviews.length
    });
  } catch (error) {
    console.error('Error fetching history:', error);
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
      res.json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('TTS endpoint error:', error);
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;