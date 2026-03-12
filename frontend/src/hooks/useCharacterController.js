import { useState, useEffect, useCallback } from 'react';

export const useCharacterController = (personality = 'professional') => {
  const [characterState, setCharacterState] = useState({
    emotion: 'neutral',
    isTalking: false,
    message: '',
    isActive: false
  });

  const characterMessages = {
    professional: {
      welcome: "Welcome to your AI interview. I'll be conducting your session today.",
      thinking: "Processing your response...",
      impressed: "That's a well-structured answer.",
      feedback: "Here's my feedback on your response:",
      next: "Ready for the next question?",
      goodbye: "Excellent work! You've completed the interview.",
      encouraging: "Take your time, I'm listening.",
      confused: "Could you elaborate on that point?",
      goodAnswer: "Excellent! That shows deep understanding.",
      averageAnswer: "Good, but try to add more specific examples.",
      poorAnswer: "Let's work on that. Try to be more structured.",
      startQuestion: "Here's your next question:",
      timeWarning: "About 30 seconds remaining for this question.",
      positive: "Great progress! Keep going!",
      negative: "Don't get discouraged. Practice makes perfect."
    },
    friendly: {
      welcome: "Hey there! 👋 Ready to practice? I'm here to help you shine!",
      thinking: "Hmm, let me think about that awesome answer...",
      impressed: "Wow! That was really impressive! 🌟",
      feedback: "Great job! Here's some friendly feedback:",
      next: "Feeling ready for the next one?",
      goodbye: "You were amazing! Keep practicing! 🎉",
      encouraging: "You've got this! Take your time.",
      confused: "That's interesting! Can you tell me more?",
      goodAnswer: "Amazing answer! You really know your stuff! ✨",
      averageAnswer: "Good start! Want to add a bit more detail?",
      poorAnswer: "No worries! Let's try a different approach.",
      startQuestion: "Ready? Here comes the next question!",
      timeWarning: "Quick reminder: about 30 seconds left!",
      positive: "You're doing fantastic! 🌈",
      negative: "Every expert was once a beginner. Keep going!"
    },
    strict: {
      welcome: "Begin your interview. Time management is crucial.",
      thinking: "Analyzing response structure...",
      impressed: "Acceptable. Proceed to next question.",
      feedback: "Here's your performance analysis:",
      next: "Continue to next question.",
      goodbye: "Interview complete. Review your feedback carefully.",
      encouraging: "Focus and be precise in your answer.",
      confused: "Your response lacks clarity. Elaborate.",
      goodAnswer: "Satisfactory. Maintain this standard.",
      averageAnswer: "Acceptable but could be more comprehensive.",
      poorAnswer: "Insufficient. Review the material and try again.",
      startQuestion: "Next question. Be concise.",
      timeWarning: "30 seconds remaining. Conclude your answer.",
      positive: "Progress noted. Continue.",
      negative: "This requires significant improvement."
    }
  };

  const emotions = {
    welcome: 'happy',
    thinking: 'thinking',
    impressed: 'happy',
    feedback: 'neutral',
    next: 'neutral',
    goodbye: 'happy',
    encouraging: 'happy',
    confused: 'concerned',
    goodAnswer: 'happy',
    averageAnswer: 'neutral',
    poorAnswer: 'concerned',
    startQuestion: 'neutral',
    timeWarning: 'concerned',
    positive: 'happy',
    negative: 'concerned'
  };

  const setEmotion = useCallback((emotion) => {
    setCharacterState(prev => ({ ...prev, emotion }));
  }, []);

  const speak = useCallback((messageKey, customMessage = '') => {
    const messages = characterMessages[personality];
    const message = customMessage || messages[messageKey] || messages.feedback;
    
    setCharacterState(prev => ({
      ...prev,
      message,
      isTalking: true,
      emotion: emotions[messageKey] || 'neutral'
    }));

    // Simulate talking animation duration
    setTimeout(() => {
      setCharacterState(prev => ({ ...prev, isTalking: false }));
    }, Math.min(3000, message.length * 50));
  }, [personality]);

  const activate = useCallback(() => {
    setCharacterState(prev => ({ ...prev, isActive: true }));
    setTimeout(() => {
      speak('welcome');
    }, 500);
  }, [speak]);

  const deactivate = useCallback(() => {
    speak('goodbye');
    setTimeout(() => {
      setCharacterState(prev => ({ ...prev, isActive: false, message: '' }));
    }, 3000);
  }, [speak]);

  const think = useCallback(() => {
    speak('thinking');
  }, [speak]);

  const reactToAnswer = useCallback((answerQuality) => {
    if (answerQuality === 'good') {
      speak('goodAnswer');
    } else if (answerQuality === 'average') {
      speak('averageAnswer');
    } else {
      speak('poorAnswer');
    }
  }, [speak]);

  const askQuestion = useCallback((question) => {
    setCharacterState(prev => ({ ...prev, emotion: 'neutral' }));
    speak('startQuestion', question);
  }, [speak]);

  const giveFeedback = useCallback((feedback) => {
    speak('feedback', feedback);
  }, [speak]);

  const showThinking = useCallback(() => {
    setCharacterState(prev => ({ ...prev, emotion: 'thinking' }));
  }, []);

  const clearMessage = useCallback(() => {
    setCharacterState(prev => ({ ...prev, message: '', isTalking: false }));
  }, []);

  return {
    characterState,
    characterController: {
      setEmotion,
      speak,
      activate,
      deactivate,
      think,
      reactToAnswer,
      askQuestion,
      giveFeedback,
      showThinking,
      clearMessage
    }
  };
};