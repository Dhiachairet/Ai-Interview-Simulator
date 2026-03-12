import React, { useState, useEffect } from 'react';
import InterviewCharacter3D from '../components/InterviewCharacter3D';
import { useCharacterController } from '../hooks/useCharacterController';

const Interview = () => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewActive, setInterviewActive] = useState(false);
  const [questions] = useState([
    "Tell me about yourself and your experience.",
    "What are your greatest strengths?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "Tell me about a challenging situation and how you handled it."
  ]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Initialize character with friendly personality (change to 'professional' or 'strict' as needed)
  const { characterState, characterController } = useCharacterController('friendly');

  useEffect(() => {
    // Auto-activate character when component mounts
    characterController.activate();
    
    return () => {
      characterController.deactivate();
    };
  }, []);

  const startInterview = () => {
    setInterviewActive(true);
    setQuestionIndex(0);
    setCurrentQuestion(questions[0]);
    characterController.askQuestion(questions[0]);
  };

  const handleAnswerChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const handleSubmitAnswer = () => {
    // Analyze answer quality (simple example)
    const answerLength = userAnswer.length;
    let quality = 'average';
    
    if (answerLength > 100) {
      quality = 'good';
    } else if (answerLength < 30) {
      quality = 'poor';
    }

    // Character reacts to answer
    characterController.showThinking();
    
    setTimeout(() => {
      characterController.reactToAnswer(quality);
      
      // Give specific feedback
      if (quality === 'good') {
        characterController.giveFeedback("Great answer! You provided specific examples and showed confidence.");
      } else if (quality === 'average') {
        characterController.giveFeedback("Good start! Try to add more specific examples from your experience.");
      } else {
        characterController.giveFeedback("Try to elaborate more. Include specific examples and achievements.");
      }
    }, 1500);

    // Move to next question after delay
    setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        setCurrentQuestion(questions[nextIndex]);
        setUserAnswer('');
        characterController.askQuestion(questions[nextIndex]);
      } else {
        // Interview complete
        setInterviewActive(false);
        characterController.speak('goodbye');
      }
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* 3D Character */}
      <InterviewCharacter3D
        isActive={characterState.isActive}
        emotion={characterState.emotion}
        isTalking={characterState.isTalking}
        message={characterState.message}
        personality="friendly"
      />

      {/* Main Interview Content */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          AI Interview Simulator
        </h1>

        {!interviewActive ? (
          <div className="text-center">
            <button
              onClick={startInterview}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Interview Practice
            </button>
            <p className="mt-4 text-gray-600">
              Practice with our AI interviewer and get instant feedback!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-500">
                  Question {questionIndex + 1} of {questions.length}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {characterState.emotion}
                </span>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {currentQuestion}
              </h2>
              
              <textarea
                value={userAnswer}
                onChange={handleAnswerChange}
                placeholder="Type your answer here..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>

            {/* Character message display (optional - already shown in 3D bubble) */}
            {characterState.message && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 italic">"{characterState.message}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interview;