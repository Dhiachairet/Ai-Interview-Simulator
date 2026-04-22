const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Vapi webhook endpoint
router.post('/vapi-webhook', async (req, res) => {
  try {
    console.log('📨 Received Vapi webhook');
    console.log('Full body:', JSON.stringify(req.body, null, 2));
    
    const { message, call, assistant } = req.body;
    
    // Handle different webhook event types
    switch (message?.type) {
      case 'end-of-call-report':
        console.log('✅ Processing end-of-call-report');
        
        // Extract data from the message (not from call)
        const transcript = message?.transcript || '';
        const summary = message?.summary || '';
        const structuredData = message?.structuredData || {};
        const analysis = message?.analysis || {};
        
        // Calculate overall score from multiple possible locations
        let overallScore = structuredData?.overallScore || 
                          analysis?.summary?.score || 
                          message?.score || 0;
        
        // Extract strengths and improvements
        const strengths = structuredData?.strengths || 
                         analysis?.summary?.strengths || [];
        const improvements = structuredData?.improvements || 
                            analysis?.summary?.weaknesses || [];
        
        // Parse transcript into questions and answers
        const questions = [];
        const lines = transcript.split('\n');
        let currentQuestion = null;
        
        for (const line of lines) {
          if (line.startsWith('Assistant:')) {
            currentQuestion = {
              question: line.replace('Assistant:', '').trim(),
              userAnswer: '',
              feedback: '',
              score: 0
            };
            questions.push(currentQuestion);
          } else if (line.startsWith('User:') && currentQuestion) {
            currentQuestion.userAnswer = line.replace('User:', '').trim();
          }
        }
        
        // Find or create interview record
        let interview = await Interview.findOne({ vapiCallId: call?.id });
        
        if (interview) {
          // Update existing interview
          interview.transcript = transcript;
          interview.summary = summary;
          interview.questions = questions.length > 0 ? questions : interview.questions;
          interview.report = {
            overallScore: overallScore,
            strengths: strengths,
            improvements: improvements,
            recommendations: structuredData?.recommendations || analysis?.summary?.recommendations || ''
          };
          interview.overallScore = overallScore;
          interview.status = 'completed';
          interview.completedAt = new Date();
          interview.duration = call?.duration || 0;
          
          await interview.save();
          console.log(`✅ Updated interview record for call ${call?.id}`);
        } else {
          // Create new interview record
          interview = await Interview.create({
            vapiCallId: call?.id,
            jobRole: call?.metadata?.jobRole || 'Unknown',
            personality: call?.metadata?.personality || 'Unknown',
            difficulty: call?.metadata?.difficulty || 'medium',
            transcript: transcript,
            summary: summary,
            questions: questions,
            report: {
              overallScore: overallScore,
              strengths: strengths,
              improvements: improvements,
              recommendations: structuredData?.recommendations || ''
            },
            overallScore: overallScore,
            status: 'completed',
            startedAt: new Date(Date.now() - (call?.duration || 0) * 1000),
            completedAt: new Date(),
            duration: call?.duration || 0,
            user: call?.metadata?.userId || null
          });
          console.log(`✅ Created new interview record for call ${call?.id}`);
        }
        break;
        
      case 'call-started':
        console.log('📞 Call started:', call?.id);
        
        // Check if record already exists
        let existingInterview = await Interview.findOne({ vapiCallId: call?.id });
        
        if (!existingInterview) {
          await Interview.create({
            vapiCallId: call?.id,
            jobRole: call?.metadata?.jobRole || 'Unknown',
            personality: call?.metadata?.personality || 'Unknown',
            difficulty: call?.metadata?.difficulty || 'medium',
            status: 'in-progress',
            startedAt: new Date(),
            user: call?.metadata?.userId || null
          });
          console.log(`✅ Created initial record for call ${call?.id}`);
        }
        break;
        
      default:
        console.log(`Unknown webhook type: ${message?.type}`);
    }
    
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(200).json({ status: 'error', error: error.message });
  }
});

module.exports = router;