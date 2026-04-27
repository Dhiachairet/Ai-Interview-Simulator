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

// Track ongoing save operations to prevent duplicates
const savingCalls = new Set();

// ✅ SINGLE SAVE VAPI CALL DATA ENDPOINT - WITH SCORE & DURATION FIX
router.post('/save-vapi-call', protect, async (req, res) => {
  const { vapiCallId, fallbackMetadata } = req.body;
  
  console.log(`📞 Saving Vapi call: ${vapiCallId}`);
  console.log(`📋 Fallback metadata:`, fallbackMetadata);
  
  if (!vapiCallId) {
    return res.status(400).json({ success: false, error: 'Missing vapiCallId' });
  }
  
  // Prevent duplicate processing
  if (savingCalls.has(vapiCallId)) {
    console.log(`⏭️ Already processing call ${vapiCallId}, skipping duplicate`);
    return res.status(200).json({ success: true, message: 'Already processing' });
  }
  
  savingCalls.add(vapiCallId);
  
  setTimeout(() => {
    savingCalls.delete(vapiCallId);
  }, 30000);

  try {
    // Fetch from Vapi API with retry for transcript
    const fetchWithRetry = async (retryCount = 0) => {
      const url = `https://api.vapi.ai/call/${vapiCallId}`;
      
      const vapiResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!vapiResponse.ok) {
        throw new Error(`Vapi API error: ${vapiResponse.status}`);
      }

      const data = await vapiResponse.json();
      const hasTranscript = data.artifact?.transcript && data.artifact.transcript.length > 0;
      
      if (!hasTranscript && retryCount < 5) {
        console.log(`⏳ Transcript not ready, retrying in 2 seconds... (attempt ${retryCount + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchWithRetry(retryCount + 1);
      }
      
      return data;
    };

    const callData = await fetchWithRetry();
    
    console.log(`✅ Fetched call ${vapiCallId} from Vapi API`);
    console.log(`📝 Transcript length: ${callData.artifact?.transcript?.length || 0}`);
    
    // ✅ Extract DURATION - try multiple locations
    let duration = callData.duration || 0;
    if (duration === 0 && callData.endedAt && callData.startedAt) {
      const start = new Date(callData.startedAt);
      const end = new Date(callData.endedAt);
      duration = Math.floor((end - start) / 1000);
    }
    console.log(`⏱️ Duration: ${duration} seconds`);
    
    // ✅ Extract OVERALL SCORE - try multiple locations
    let overallScore = 0;
    
    // Check report.overallScore
    if (callData.report?.overallScore) {
      overallScore = callData.report.overallScore;
    }
    // Check analysis.structuredData.overallScore
    else if (callData.analysis?.structuredData?.overallScore) {
      overallScore = callData.analysis.structuredData.overallScore;
    }
    // Check analysis.score
    else if (callData.analysis?.score) {
      overallScore = callData.analysis.score;
    }
    // Check messages for score
    else if (callData.messages && callData.messages.length > 0) {
      for (const msg of callData.messages) {
        if (msg.content && msg.content.includes('Score:')) {
          const match = msg.content.match(/Score:\s*(\d+)/i);
          if (match) {
            overallScore = parseInt(match[1]);
            break;
          }
        }
      }
    }
    
    console.log(`📊 Overall Score: ${overallScore}%`);
    
    // Use fallback metadata from frontend
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
    
    // Extract transcript
    const transcript = callData.artifact?.transcript || '';
    const recordingUrl = callData.artifact?.recordingUrl || '';
    const summary = callData.analysis?.summary || '';
    const structuredData = callData.analysis?.structuredData || {};
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
    
    console.log(`📝 Parsed ${questions.length} questions from transcript`);
    console.log(`📋 FINAL - Role: ${jobRole}, Personality: ${personality}, Difficulty: ${difficulty}`);
    console.log(`⏱️ FINAL Duration: ${duration}s, 📊 FINAL Score: ${overallScore}%`);
    
    // Find existing interview or create new one
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
      duration: duration,
      overallScore: overallScore,
      report: {
        overallScore: overallScore,
        strengths: strengths,
        improvements: improvements,
        fullAnalysis: structuredData
      },
      status: 'completed',
      completedAt: new Date()
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
    console.error('❌ Error saving Vapi call:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    savingCalls.delete(vapiCallId);
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