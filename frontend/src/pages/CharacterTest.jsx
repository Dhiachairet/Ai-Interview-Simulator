import React, { useState } from 'react';
import InterviewCharacter3D from '../components/InterviewCharacter3D';
import { useCharacterController } from '../hooks/useCharacterController';

const CharacterTest = () => {
  const [personality, setPersonality] = useState('friendly');
  const [showCharacter, setShowCharacter] = useState(true);
  
  const { characterState, characterController } = useCharacterController(personality);

  const testMessages = {
    friendly: {
      welcome: "Hi! I'm your friendly AI interview coach! Ready to practice? 🌟",
      thinking: "Let me analyze your response... 🤔",
      happy: "Excellent answer! You're doing great! 🎉",
      feedback: "Here's your personalized feedback to help you improve:",
      question: "Ready for the next challenge?",
      encourage: "You've got this! Keep going! 💪"
    },
    professional: {
      welcome: "Good day. I'll be conducting your professional interview.",
      thinking: "Processing your response...",
      happy: "Well-articulated response. Proceed.",
      feedback: "Here's your performance analysis:",
      question: "Next question prepared.",
      encourage: "Maintain this professional standard."
    },
    strict: {
      welcome: "Interview beginning. Time is valuable.",
      thinking: "Analyzing response quality...",
      happy: "Acceptable. Continue.",
      feedback: "Review your performance metrics:",
      question: "Next question. Be concise.",
      encourage: "Focus on precision and clarity."
    }
  };

  const handleSpeak = (type) => {
    characterController.speak(type, testMessages[personality][type]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Right side content (the other half of the page) */}
      <div style={{ 
        marginLeft: '50vw', // Push content to the right half
        minHeight: '100vh',
        padding: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            AI Interview Coach
          </h1>
          
          <p style={{ fontSize: '18px', marginBottom: '40px', opacity: 0.9 }}>
            Your personal AI interviewer with high-fidelity 3D graphics
          </p>

          {/* Control Panel */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Character Controls</h2>
            
            {/* Personality Selection */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>Personality:</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['friendly', 'professional', 'strict'].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setPersonality(p);
                      setTimeout(() => characterController.activate(), 100);
                    }}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '30px',
                      border: 'none',
                      background: personality === p ? 'white' : 'rgba(255,255,255,0.2)',
                      color: personality === p ? '#667eea' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.3s',
                      textTransform: 'capitalize'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Controls */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>Test Messages:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {['welcome', 'thinking', 'happy', 'feedback', 'question', 'encourage'].map(action => (
                  <button
                    key={action}
                    onClick={() => handleSpeak(action)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Status */}
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '10px', 
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '10px' }}>Status:</h3>
              <p>Emotion: <span style={{ textTransform: 'capitalize' }}>{characterState.emotion}</span></p>
              <p>Talking: {characterState.isTalking ? '🗣️ Yes' : '🔇 No'}</p>
            </div>

            {/* Current Message */}
            {characterState.message && (
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '10px', 
                padding: '15px',
                fontStyle: 'italic',
                borderLeft: '4px solid white'
              }}>
                "{characterState.message}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character takes left half */}
      <InterviewCharacter3D
        isActive={showCharacter}
        emotion={characterState.emotion}
        isTalking={characterState.isTalking}
        message={characterState.message}
        personality={personality}
      />
    </div>
  );
};

export default CharacterTest;