import React, { useState, useRef, useEffect, useCallback } from 'react';
import interviewService from '../services/interviewService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  PhoneXMarkIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';

// Voice Recognition Hook
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalText += transcriptText + ' ';
        } else {
          interimText += transcriptText;
        }
      }

      if (finalText) {
        setTranscript(prev => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'audio-capture':
          setError('No microphone found. Please check your microphone connection.');
          setIsListening(false);
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
          break;
        case 'network':
          console.info('Speech recognition network error. Voice recognition requires an internet connection.');
          setIsListening(false);
          break;
        case 'no-speech':
          setIsListening(false);
          break;
        default:
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) {
      return;
    }

    try {
      setError(null);
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      
      if (err.name === 'InvalidStateError') {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        } catch (restartErr) {
          setError('Failed to start voice recognition. Please try again.');
          setIsListening(false);
        }
      } else {
        setError('Failed to start voice recognition. Please check your microphone and internet connection.');
        setIsListening(false);
      }
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    supported,
    startListening,
    stopListening,
    resetTranscript
  };
};

// Voice Wave Animation Component
const VoiceWave = ({ active, color = "bg-cyan-500" }) => (
  <div className="flex items-center gap-0.5 h-6">
    {Array.from({ length: 24 }).map((_, i) => (
      <motion.div
        key={i}
        className={`w-[3px] rounded-full ${color}`}
        animate={{
          height: active ? [3, Math.random() * 24 + 4, 3] : 3,
        }}
        transition={{
          duration: 0.5,
          repeat: active ? Infinity : 0,
          delay: i * 0.04,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// Floating particle for AI avatar background
const AvatarParticle = ({ delay, size, x, y }) => (
  <motion.div
    className="absolute rounded-full bg-cyan-500/15"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
    }}
    animate={{
      y: [-8, 8, -8],
      opacity: [0.3, 0.7, 0.3],
    }}
    transition={{
      duration: 3 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  
  const sessionDetails = location.state || {
    role: 'Frontend Developer',
    style: 'Strict Technical',
    difficulty: 'Hard'
  };

  // Voice recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    supported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  const [isLoading, setIsLoading] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions] = useState(5);
  const [showError, setShowError] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  // Update input text when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Show error toast
  useEffect(() => {
    if (voiceError) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [voiceError]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start interview when component mounts
  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const response = await interviewService.startInterview({
        jobRole: sessionDetails.role,
        personality: sessionDetails.style,
        difficulty: sessionDetails.difficulty
      });
      
      if (response.success) {
        const firstQuestion = response.question;
        setCurrentQuestionText(firstQuestion);
        setCurrentQuestionNumber(1);
        setMessages([{ 
          role: "ai", 
          text: firstQuestion 
        }]);
      } else {
        // Fallback if API fails
        const fallbackQuestion = `Welcome to your ${sessionDetails.difficulty} level interview for ${sessionDetails.role}. Tell me about yourself and your experience.`;
        setCurrentQuestionText(fallbackQuestion);
        setCurrentQuestionNumber(1);
        setMessages([{ 
          role: "ai", 
          text: fallbackQuestion 
        }]);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      const fallbackQuestion = `Welcome to your interview! Let's begin. Tell me about yourself and your experience with ${sessionDetails.role}.`;
      setCurrentQuestionText(fallbackQuestion);
      setCurrentQuestionNumber(1);
      setMessages([{ 
        role: "ai", 
        text: fallbackQuestion 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || interviewComplete) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", text: textToSend }]);
    setInputText("");
    resetTranscript();
    
    // Add thinking indicator
    setMessages(prev => [...prev, { role: "ai", text: "...", isThinking: true }]);
    
    try {
      const isComplete = currentQuestionNumber >= totalQuestions;
      
      const response = await interviewService.submitAnswer({
        jobRole: sessionDetails.role,
        personality: sessionDetails.style,
        difficulty: sessionDetails.difficulty,
        currentQuestion: currentQuestionText,
        userAnswer: textToSend,
        questionNumber: currentQuestionNumber,
        isComplete: isComplete
      });
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(msg => !msg.isThinking));
      
      if (response.success) {
        // Add AI feedback
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: `📊 **Feedback:** ${response.evaluation.feedback}\n\n⭐ **Score:** ${response.evaluation.score}/100\n\n💪 **Strengths:** ${response.evaluation.strengths?.join(', ') || 'Good effort'}\n\n🎯 **Improvements:** ${response.evaluation.improvements?.join(', ') || 'Keep practicing'}` 
        }]);
        
        if (response.nextQuestion && !response.isComplete) {
          // Add next question after a delay
          setTimeout(() => {
            setMessages(prev => [...prev, { role: "ai", text: response.nextQuestion }]);
            setCurrentQuestionText(response.nextQuestion);
            setCurrentQuestionNumber(prev => prev + 1);
          }, 2000);
        } else if (response.isComplete || (!response.nextQuestion && currentQuestionNumber >= totalQuestions)) {
          setInterviewComplete(true);
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              role: "ai", 
              text: "🎉 **Interview Complete!** 🎉\n\nThank you for participating in this interview practice session.\n\nYour responses have been recorded. You can now return to the dashboard to view your progress and start new interviews.\n\nKeep practicing to improve your scores!" 
            }]);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setMessages(prev => prev.filter(msg => !msg.isThinking));
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: "Sorry, I encountered an error processing your answer. Please try again." 
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInputText("");
      startListening();
    }
  };

  const handleEndInterview = () => {
    navigate('/interview-config');
  };

  // Combined text for display
  const displayText = inputText + (isListening && interimTranscript ? ' ' + interimTranscript : '');

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: 'hsl(222 30% 6%)' }}>
      {/* Top Bar */}
      <div className="h-12 border-b flex items-center px-6" style={{ borderColor: 'hsl(222 20% 15%)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndInterview}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-70"
            style={{ backgroundColor: 'hsl(222 25% 10%)', color: 'hsl(222 10% 60%)' }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
              {sessionDetails.role} Interview
            </h1>
            <p className="text-xs" style={{ color: 'hsl(222 10% 50%)' }}>
              {sessionDetails.style} • {sessionDetails.difficulty}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm" style={{ color: 'hsl(222 10% 60%)' }}>
            Question {currentQuestionNumber} of {totalQuestions}
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" style={{ color: 'hsl(222 10% 60%)' }} />
            <span className="text-sm font-mono" style={{ color: 'hsl(0 0% 100%)' }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5" style={{ backgroundColor: 'hsl(222 20% 15%)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(to right, hsl(189 95% 50%), hsl(217 91% 60%))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Area */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* Interview Area */}
        <div className={`flex-1 flex flex-col p-6 transition-all duration-300 ${showChat ? 'mr-[340px]' : ''}`}>
          {/* Video Grid */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* AI Interviewer Card */}
            <motion.div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ backgroundColor: 'hsl(222 25% 10%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AvatarParticle delay={0} size={40} x="10%" y="20%" />
              <AvatarParticle delay={0.5} size={30} x="70%" y="60%" />
              <AvatarParticle delay={1} size={50} x="80%" y="10%" />
              <AvatarParticle delay={1.5} size={25} x="20%" y="80%" />

              <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
                    AI Interviewer
                  </h3>
                  <div className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: 'hsl(189 95% 50% / 0.1)',
                      color: 'hsl(189 95% 50%)'
                    }}>
                    {isLoading ? "Loading..." : interviewComplete ? "Complete" : "Active"}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      width: '200px',
                      height: '200px',
                      borderColor: 'hsl(189 95% 50% / 0.2)',
                      left: '-50px',
                      top: '-50px'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      width: '240px',
                      height: '240px',
                      borderColor: 'hsl(217 91% 60% / 0.2)',
                      left: '-70px',
                      top: '-70px'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />

                  <motion.div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(189 95% 50%), hsl(217 91% 60%))',
                      boxShadow: '0 0 40px hsl(189 95% 50% / 0.5)'
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 40px hsl(189 95% 50% / 0.5)',
                        '0 0 60px hsl(189 95% 50% / 0.8)',
                        '0 0 40px hsl(189 95% 50% / 0.5)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CpuChipIcon className="w-12 h-12 text-white" />
                  </motion.div>
                </div>

                <div className="mt-8">
                  <VoiceWave active={!interviewComplete && !isLoading} color="bg-cyan-500" />
                </div>
              </div>
            </motion.div>

            {/* User Camera Card */}
            <motion.div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ backgroundColor: 'hsl(222 25% 10%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
                    Your Camera
                  </h3>
                  <div className="flex items-center gap-2">
                    {isVideoOn ? (
                      <VideoCameraIcon className="w-5 h-5" style={{ color: 'hsl(189 95% 50%)' }} />
                    ) : (
                      <VideoCameraSlashIcon className="w-5 h-5" style={{ color: 'hsl(0 80% 60%)' }} />
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {isVideoOn ? (
                  <div className="w-full h-full rounded-xl overflow-hidden"
                    style={{ backgroundColor: 'hsl(222 20% 15%)' }}>
                    <div className="flex items-center justify-center h-full">
                      <UserCircleIcon className="w-32 h-32" style={{ color: 'hsl(222 10% 60%)' }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(222 10% 60%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(222 10% 60%)' }}>
                      Camera is off
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Current Question */}
          <motion.div
            className="mt-4 p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: 'hsl(222 25% 10%)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(189 95% 50%)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-1" style={{ color: 'hsl(222 10% 60%)' }}>
                  Current Question
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(0 0% 100%)' }}>
                  {isLoading ? "Loading your first question..." : currentQuestionText || "Click start to begin"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3 flex-shrink-0">
            <motion.button
              onClick={toggleVoiceRecognition}
              disabled={!voiceSupported || interviewComplete}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative"
              style={{
                backgroundColor: isListening ? 'hsl(0 80% 60%)' : 'hsl(222 25% 10%)',
                color: 'hsl(0 0% 100%)',
                opacity: voiceSupported && !interviewComplete ? 1 : 0.5,
                cursor: voiceSupported && !interviewComplete ? 'pointer' : 'not-allowed'
              }}
              whileHover={{ scale: voiceSupported && !interviewComplete ? 1.1 : 1 }}
              whileTap={{ scale: voiceSupported && !interviewComplete ? 0.95 : 1 }}
            >
              <MicrophoneIcon className="w-5 h-5" />
              {isListening && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'hsl(0 80% 60%)' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: isVideoOn ? 'hsl(222 25% 10%)' : 'hsl(0 80% 60%)',
                color: 'hsl(0 0% 100%)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isVideoOn ? <VideoCameraIcon className="w-5 h-5" /> : <VideoCameraSlashIcon className="w-5 h-5" />}
            </motion.button>

            <motion.button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: 'hsl(222 25% 10%)',
                color: 'hsl(0 0% 100%)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ComputerDesktopIcon className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={handleEndInterview}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: 'hsl(0 80% 60%)',
                color: 'hsl(0 0% 100%)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneXMarkIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              className="fixed right-0 top-12 h-[calc(100vh-48px)] w-[340px] border-l flex flex-col"
              style={{
                backgroundColor: 'hsl(222 25% 10%)',
                borderColor: 'hsl(222 20% 15%)'
              }}
              initial={{ x: 340 }}
              animate={{ x: 0 }}
              exit={{ x: 340 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(222 20% 15%)' }}>
                <h3 className="font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
                  Conversation Log
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-70"
                  style={{ backgroundColor: 'hsl(222 30% 6%)', color: 'hsl(222 10% 60%)' }}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-gray-400 py-8">
                    Click start to begin your interview
                  </div>
                )}
                {isLoading && messages.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    Loading your interview...
                  </div>
                )}
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                      } ${message.isThinking ? 'opacity-70' : ''}`}
                      style={{
                        backgroundColor: message.role === 'user'
                          ? 'hsl(217 91% 60% / 0.2)'
                          : 'hsl(222 30% 6%)',
                        color: 'hsl(0 0% 100%)'
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.isThinking ? (
                          <span className="flex items-center gap-1">
                            Thinking<span className="animate-pulse">.</span><span className="animate-pulse delay-100">.</span><span className="animate-pulse delay-200">.</span>
                          </span>
                        ) : (
                          message.text
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t" style={{ borderColor: 'hsl(222 20% 15%)' }}>
                {!voiceSupported && (
                  <div className="mb-3 p-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'hsl(45 100% 50% / 0.1)', border: '1px solid hsl(45 100% 50% / 0.3)' }}>
                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(45 100% 50%)' }} />
                    <p className="text-xs" style={{ color: 'hsl(45 100% 70%)' }}>
                      Voice input requires Chrome, Edge (v79+), or Safari (v14.1+) with internet connection.
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={displayText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        if (isListening) {
                          stopListening();
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={interviewComplete}
                      placeholder={interviewComplete ? "Interview complete" : (isListening ? "Listening..." : "Type or speak your answer...")}
                      className="w-full px-4 py-2 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        backgroundColor: isListening ? 'hsl(0 80% 60% / 0.1)' : 'hsl(222 30% 6%)',
                        color: 'hsl(0 0% 100%)',
                        border: isListening ? '1px solid hsl(0 80% 60%)' : '1px solid hsl(222 20% 15%)',
                        paddingRight: isListening ? '40px' : '16px',
                        opacity: interviewComplete ? 0.5 : 1,
                        cursor: interviewComplete ? 'not-allowed' : 'text'
                      }}
                    />
                    {isListening && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 rounded-full"
                            style={{ backgroundColor: 'hsl(0 80% 60%)' }}
                            animate={{
                              height: [4, 12, 4]
                            }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <motion.button
                    onClick={toggleVoiceRecognition}
                    disabled={!voiceSupported || interviewComplete}
                    className="w-10 h-10 rounded-lg flex items-center justify-center relative"
                    style={{
                      backgroundColor: isListening ? 'hsl(0 80% 60%)' : 'hsl(222 25% 10%)',
                      color: 'hsl(0 0% 100%)',
                      opacity: voiceSupported && !interviewComplete ? 1 : 0.5,
                      cursor: voiceSupported && !interviewComplete ? 'pointer' : 'not-allowed'
                    }}
                    whileHover={{ scale: voiceSupported && !interviewComplete ? 1.05 : 1 }}
                    whileTap={{ scale: voiceSupported && !interviewComplete ? 0.95 : 1 }}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={handleSend}
                    disabled={!displayText.trim() || interviewComplete}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: displayText.trim() && !interviewComplete
                        ? 'linear-gradient(135deg, hsl(189 95% 50%), hsl(217 91% 60%))'
                        : 'hsl(222 25% 10%)',
                      color: 'hsl(0 0% 100%)',
                      opacity: displayText.trim() && !interviewComplete ? 1 : 0.5,
                      cursor: displayText.trim() && !interviewComplete ? 'pointer' : 'not-allowed'
                    }}
                    whileHover={{ scale: displayText.trim() && !interviewComplete ? 1.05 : 1 }}
                    whileTap={{ scale: displayText.trim() && !interviewComplete ? 0.95 : 1 }}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Toggle Button */}
        <AnimatePresence>
          {!showChat && (
            <motion.button
              onClick={() => setShowChat(true)}
              className="fixed right-6 bottom-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(189 95% 50%), hsl(217 91% 60%))',
                color: 'hsl(0 0% 100%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Voice Listening Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center gap-3 shadow-xl z-50"
              style={{
                backgroundColor: 'hsl(0 80% 60%)',
                color: 'hsl(0 0% 100%)'
              }}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-medium">Listening...</span>
              <div className="flex gap-1 ml-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [4, 12, 4]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {showError && voiceError && (
            <motion.div
              className="fixed top-20 right-6 px-6 py-4 rounded-xl flex items-start gap-3 shadow-xl z-50 max-w-md"
              style={{
                backgroundColor: 'hsl(0 80% 60%)',
                color: 'hsl(0 0% 100%)'
              }}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
            >
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Voice Recognition Error</p>
                <p className="text-xs opacity-90">{voiceError}</p>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewSession;