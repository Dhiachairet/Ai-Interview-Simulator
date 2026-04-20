import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PhoneIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import vapiService from '../services/vapiService';

const VapiCallSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  
  const sessionDetails = location.state || {
    personality: 'Strict Technical',
    jobRole: 'Frontend Developer',
    difficulty: 'medium'
  };
  
  const [callStatus, setCallStatus] = useState('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  
  useEffect(() => {
    let timer;
    if (callStatus === 'active') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if message contains ending phrases
  const containsEndPhrases = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    const endPhrases = [
      'goodbye', 
      'thank you for your time', 
      'thanks for the interview', 
      'interview complete',
      'have a great day',
      'this concludes',
      'end of interview',
      'no more questions'
    ];
    return endPhrases.some(phrase => lowerText.includes(phrase));
  };
  
  // Define event handlers as functions
  const handleCallStart = () => {
    console.log('📞 Vapi call started');
    setCallStatus('active');
  };
  
  const handleCallEnd = () => {
    console.log('🔚 Vapi call ended');
    setCallStatus('ended');
    setTimeout(() => {
      navigate('/history');
    }, 3000);
  };
  
const handleMessage = (msg) => {
  if (msg.type === 'transcript' && msg.transcript) {
    setTranscripts(prev => {
      const last = prev[prev.length - 1];

      // If same speaker and last message not final → update it
      if (
        last &&
        last.role === msg.role &&
        !last.isFinal
      ) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          text: msg.transcript,
          isFinal: msg.final || false,
          timestamp: new Date().toLocaleTimeString()
        };
        return updated;
      }

      // Otherwise add new message
      return [
        ...prev,
        {
          text: msg.transcript,
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          timestamp: new Date().toLocaleTimeString(),
          isFinal: msg.final || false
        }
      ];
    });

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
};
  
  const handleStatusUpdate = (status) => {
    console.log('🔄 Status update:', status);
    if (status === 'connected') {
      setCallStatus('active');
    }
  };
  
  const handleError = (error) => {
    console.error('❌ Vapi error:', error);
    setErrorMessage(error.message || 'An error occurred');
    setCallStatus('error');
  };
  
  useEffect(() => {
    // Get the Vapi instance
    const vapi = vapiService.vapi;
    
    if (!vapi) {
      console.warn('Vapi instance not available, waiting...');
      // Wait a bit and try again
      const checkInterval = setInterval(() => {
        if (vapiService.vapi) {
          console.log('Vapi instance found, setting up listeners');
          clearInterval(checkInterval);
          setupEventListeners(vapiService.vapi);
        }
      }, 500);
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        console.error('Vapi instance never became available');
        setErrorMessage('Failed to initialize voice service');
        setCallStatus('error');
      }, 10000);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
    
    setupEventListeners(vapi);
    
    return () => {
      // Cleanup event listeners
      if (vapiService.vapi) {
        try {
          vapiService.vapi.off('call-start', handleCallStart);
          vapiService.vapi.off('call-end', handleCallEnd);
vapiService.vapi.off('message', handleMessage);          vapiService.vapi.off('status-update', handleStatusUpdate);
          vapiService.vapi.off('error', handleError);
        } catch (e) {
          console.warn('Error cleaning up event listeners:', e);
        }
      }
      
      if (callStatus === 'active') {
        vapiService.stopInterview();
      }
    };
  }, []);
  
  const setupEventListeners = (vapi) => {
    console.log('Setting up Vapi event listeners');
    
    try {
      vapi.on('call-start', handleCallStart);
      vapi.on('call-end', handleCallEnd);
vapi.on('message', handleMessage);      vapi.on('status-update', handleStatusUpdate);
      vapi.on('error', handleError);
      console.log('Vapi event listeners configured successfully');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  };
  
  const handleMuteToggle = () => {
    const newMutedState = vapiService.toggleMute();
    setIsMuted(newMutedState);
  };
  
  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      vapiService.stopInterview();
      setCallStatus('ended');
    }
  };
  
  const handleGoBack = () => {
    if (callStatus === 'active') {
      if (window.confirm('Ending this interview will save your progress. Continue?')) {
        vapiService.stopInterview();
        navigate('/history');
      }
    } else {
      navigate('/interview-config');
    }
  };
  
  const getPersonalityColor = () => {
    switch (sessionDetails.personality) {
      case 'Strict Technical': return 'from-blue-500 to-cyan-500';
      case 'Friendly HR': return 'from-green-500 to-emerald-500';
      case 'Stress Tester': return 'from-red-500 to-orange-500';
      case 'Theoretical Expert': return 'from-purple-500 to-violet-500';
      default: return 'from-cyan-500 to-blue-500';
    }
  };
  
  const getStatusDisplay = () => {
    switch (callStatus) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'active':
        return { text: 'In Progress', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'ended':
        return { text: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 'error':
        return { text: 'Error', color: 'text-red-400', bg: 'bg-red-500/20' };
      default:
        return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };
  
  const status = getStatusDisplay();
  
  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white flex flex-col overflow-hidden">
      <div className="h-12 border-b flex items-center px-6" style={{ borderColor: 'hsl(222 20% 15%)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-70"
            style={{ backgroundColor: 'hsl(222 25% 10%)', color: 'hsl(222 10% 60%)' }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
              {sessionDetails.jobRole} Interview
            </h1>
            <p className="text-xs" style={{ color: 'hsl(222 10% 50%)' }}>
              {sessionDetails.personality} • {sessionDetails.difficulty}
            </p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.text}
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" style={{ color: 'hsl(222 10% 60%)' }} />
            <span className="text-sm font-mono" style={{ color: 'hsl(0 0% 100%)' }}>
              {formatTime(callDuration)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                <UserCircleIcon className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                {sessionDetails.personality} Interviewer
              </h2>
              <p className="text-gray-400 text-sm">
                Speaking naturally • The AI will listen and respond
              </p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-6 text-center">
              {callStatus === 'connecting' && (
                <div className="space-y-4">
                  <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-300">Connecting to AI interviewer...</p>
                </div>
              )}
              
              {callStatus === 'active' && (
                <div className="space-y-4">
                  <div className="flex justify-center gap-4">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <PhoneIcon className="w-8 h-8 text-green-400" />
                    </motion.div>
                  </div>
                  <p className="text-green-400 font-medium">Interview in Progress</p>
                  <p className="text-gray-300">The AI interviewer is speaking. You can respond naturally.</p>
                  <p className="text-xs text-gray-500 mt-2">Your responses will appear in the live transcript</p>
                </div>
              )}
              
              {callStatus === 'ended' && (
                <div className="space-y-4">
                  <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto" />
                  <p className="text-green-400 font-medium">Interview Complete!</p>
                  <p className="text-gray-300">Redirecting to history...</p>
                </div>
              )}
              
              {callStatus === 'error' && (
                <div className="space-y-4">
                  <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto" />
                  <p className="text-red-400 font-medium">Connection Error</p>
                  <p className="text-gray-300">{errorMessage || 'Failed to connect.'}</p>
                  <button
                    onClick={() => navigate('/interview-config')}
                    className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition"
                  >
                    Return to Configuration
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {callStatus === 'active' && (
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMuteToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="w-6 h-6 text-white" />
                ) : (
                  <SpeakerWaveIcon className="w-6 h-6 text-white" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200"
              >
                <PhoneXMarkIcon className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {showChat && callStatus === 'active' && (
          <motion.div
            className="fixed right-0 top-12 h-[calc(100vh-48px)] w-[340px] border-l flex flex-col"
            style={{ backgroundColor: 'hsl(222 25% 10%)', borderColor: 'hsl(222 20% 15%)' }}
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(222 20% 15%)' }}>
              <h3 className="font-medium" style={{ color: 'hsl(0 0% 100%)' }}>
                Live Transcript
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-70"
                style={{ backgroundColor: 'hsl(222 30% 6%)', color: 'hsl(222 10% 60%)' }}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {transcripts.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Transcript will appear here...</p>
                  <p className="text-xs mt-2">Speak naturally and the AI's responses will appear</p>
                </div>
              )}
              {transcripts.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      item.role === 'user' 
                        ? 'bg-blue-500/20 rounded-br-none' 
                        : 'bg-white/10 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm text-white whitespace-pre-wrap">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!showChat && callStatus === 'active' && (
        <motion.button
          onClick={() => setShowChat(true)}
          className="fixed right-6 bottom-6 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  );
};

export default VapiCallSession;