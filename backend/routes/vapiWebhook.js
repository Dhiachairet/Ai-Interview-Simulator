const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Vapi webhook endpoint
router.post('/vapi-webhook', async (req, res) => {
  try {
    console.log('📨 Received Vapi webhook');
    
    const { message, call } = req.body;
    
    console.log('Message type:', message?.type);
    
    switch (message?.type) {
      case 'end-of-call-report':
        console.log('✅ Processing end-of-call-report');
        
        // ✅ CORRECT: Extract transcript from call.artifact
        const artifact = call?.artifact || {};
        const transcript = artifact?.transcript || '';
        const recordingUrl = artifact?.recordingUrl || '';
        const messages = artifact?.messages || [];
        
        // Extract analysis
        const analysis = message?.analysis || call?.analysis || {};
        const summary = analysis?.summary || '';
        const structuredData = analysis?.structuredData || {};
        
        // Calculate overall score
        let overallScore = structuredData?.overallScore || 
                          analysis?.score || 
                          message?.cost ? 75 : 0;
        
        // Extract strengths and improvements
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
        
        // Find and update interview
        let interview = await Interview.findOne({ vapiCallId: call?.id });
        
        const interviewData = {
          transcript: transcript,
          summary: summary,
          questions: questions.length > 0 ? questions : [],
          report: {
            overallScore: overallScore,
            strengths: strengths,
            improvements: improvements,
            recommendations: structuredData?.recommendations || '',
            recordingUrl: recordingUrl,
            fullAnalysis: structuredData
          },
          overallScore: overallScore,
          status: 'completed',
          completedAt: new Date(),
          duration: call?.duration || 0
        };
        
        if (interview) {
          Object.assign(interview, interviewData);
          await interview.save();
          console.log(`✅ Updated interview for call ${call?.id}`);
        } else {
          interview = await Interview.create({
            vapiCallId: call?.id,
            jobRole: call?.metadata?.jobRole || 'Unknown',
            personality: call?.metadata?.personality || 'Unknown',
            difficulty: call?.metadata?.difficulty || 'medium',
            user: call?.metadata?.userId || null,
            ...interviewData
          });
          console.log(`✅ Created new interview for call ${call?.id}`);
        }
        break;
        
      case 'call-started':
        console.log('📞 Call started:', call?.id);
        
        let existing = await Interview.findOne({ vapiCallId: call?.id });
        if (!existing) {
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