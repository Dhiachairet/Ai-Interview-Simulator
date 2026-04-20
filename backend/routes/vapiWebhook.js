const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Vapi webhook endpoint
router.post('/vapi-webhook', async (req, res) => {
  try {
    const { message, call, assistant } = req.body;
    
    console.log('📨 Received Vapi webhook:', message?.type || 'unknown');
    
    switch (message?.type) {
      case 'end-of-call-report':
        // Extract the full conversation from the transcript
        const transcript = message?.transcript || '';
        const messages = parseTranscriptToMessages(transcript);
        
        // Extract structured data from Vapi's analysis
        const structuredData = message?.structuredData || {};
        const analysis = message?.analysis || {};
        
        // Build questions array from the conversation
        const questions = [];
        let currentQuestion = null;
        
        for (const msg of messages) {
          if (msg.role === 'assistant') {
            currentQuestion = {
              question: msg.text,
              userAnswer: '',
              feedback: '',
              score: 0
            };
            questions.push(currentQuestion);
          } else if (msg.role === 'user' && currentQuestion) {
            currentQuestion.userAnswer = msg.text;
          }
        }
        
        // Calculate overall score
        let overallScore = structuredData?.overallScore || 0;
        if (!overallScore && analysis?.summary?.score) {
          overallScore = analysis.summary.score;
        }
        
        // Get strengths and improvements
        const strengths = structuredData?.strengths || analysis?.summary?.strengths || [];
        const improvements = structuredData?.improvements || analysis?.summary?.weaknesses || [];
        
        // Find and update the interview
        let interview = await Interview.findOne({ vapiCallId: call?.id });
        
        if (interview) {
          // Update existing interview with all data
          interview.transcript = transcript;
          interview.summary = message?.summary || '';
          interview.questions = questions;
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
          console.log(`✅ Updated interview record for call ${call?.id} with ${questions.length} questions`);
        } else {
          // Create new interview record
          interview = await Interview.create({
            vapiCallId: call?.id,
            jobRole: call?.metadata?.jobRole || 'Unknown',
            personality: call?.metadata?.personality || 'Unknown',
            difficulty: call?.metadata?.difficulty || 'medium',
            transcript: transcript,
            summary: message?.summary || '',
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
          console.log(`✅ Created new interview record for call ${call?.id} with ${questions.length} questions`);
        }
        break;
        
      case 'call-started':
        // Create initial interview record
        await Interview.create({
          vapiCallId: call?.id,
          jobRole: call?.metadata?.jobRole || 'Unknown',
          personality: call?.metadata?.personality || 'Unknown',
          difficulty: call?.metadata?.difficulty || 'medium',
          status: 'in-progress',
          startedAt: new Date(),
          user: call?.metadata?.userId || null
        });
        console.log(`📞 Interview started for call ${call?.id}`);
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

// Helper function to parse transcript into messages
function parseTranscriptToMessages(transcript) {
  const messages = [];
  
  if (!transcript) return messages;
  
  // Vapi transcript format example:
  // "Assistant: Hello! Tell me about yourself.\nUser: I'm a developer...\nAssistant: Great!"
  
  const lines = transcript.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('Assistant:')) {
      messages.push({
        role: 'assistant',
        text: line.replace('Assistant:', '').trim()
      });
    } else if (line.startsWith('User:')) {
      messages.push({
        role: 'user',
        text: line.replace('User:', '').trim()
      });
    }
  }
  
  return messages;
}

module.exports = router;