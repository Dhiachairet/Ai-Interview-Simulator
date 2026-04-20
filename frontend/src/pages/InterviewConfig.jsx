import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  ServerIcon,
  CubeIcon,
  ChartPieIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import vapiService from '../services/vapiService';

// Map UI IDs to personality names (must match ASSISTANT_IDS keys in vapiService)
const PERSONALITY_MAP = {
  'strict-technical': 'Strict Technical',
  'friendly-hr': 'Friendly HR',
  'stress-tester': 'Stress Tester',
  'theoretical-expert': 'Theoretical Expert'
};

// Map job role IDs to display names for Vapi
const JOB_ROLE_MAP = {
  'hr-manager': 'HR Manager',
  'frontend': 'Frontend Developer',
  'backend': 'Backend Developer',
  'product-manager': 'Product Manager',
  'data-scientist': 'Data Scientist'
};

const InterviewConfig = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [vapiStatus, setVapiStatus] = useState('idle'); // idle, initializing, ready, error
  const [vapiError, setVapiError] = useState(null);

  // Initialize Vapi on component mount
  useEffect(() => {
    const initVapi = async () => {
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      
      if (!publicKey) {
        console.error('VITE_VAPI_PUBLIC_KEY not found in environment variables');
        setVapiStatus('error');
        setVapiError('Vapi configuration missing. Please check your environment variables.');
        return;
      }
      
      setVapiStatus('initializing');
      
      // Small delay to ensure Vapi service is ready
      setTimeout(() => {
        const initialized = vapiService.initialize(publicKey);
        
        if (initialized) {
          setVapiStatus('ready');
          console.log('Vapi service ready');
        } else {
          setVapiStatus('error');
          setVapiError('Failed to initialize Vapi service');
        }
      }, 500);
    };
    
    initVapi();
    
    // Cleanup on unmount
    return () => {
      if (vapiService.isActive()) {
        vapiService.stopInterview();
      }
    };
  }, []);

  const jobRoles = [
    {
      id: 'hr-manager',
      title: 'HR Manager',
      description: 'People management, culture',
      icon: <UserCircleIcon className="h-8 w-8" />,
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      id: 'frontend',
      title: 'Frontend Developer',
      description: 'React, CSS, JavaScript',
      icon: <CodeBracketIcon className="h-8 w-8" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'backend',
      title: 'Backend Developer',
      description: 'Node.js, APIs, Databases',
      icon: <ServerIcon className="h-8 w-8" />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      description: 'Strategy, roadmaps, metrics',
      icon: <CubeIcon className="h-8 w-8" />,
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      description: 'ML, analytics, Python',
      icon: <ChartPieIcon className="h-8 w-8" />,
      gradient: 'from-orange-500 to-amber-500'
    }
  ];

  const interviewerStyles = [
    {
      id: 'strict-technical',
      name: 'Strict Technical',
      description: 'Deep technical questions, no hand-holding',
      icon: <BoltIcon className="h-7 w-7" />,
      gradient: 'from-blue-600 to-blue-400',
      borderColor: 'border-blue-500/50'
    },
    {
      id: 'friendly-hr',
      name: 'Friendly HR',
      description: 'Behavioral, warm, encouraging',
      icon: <ChatBubbleBottomCenterTextIcon className="h-7 w-7" />,
      gradient: 'from-green-600 to-green-400',
      borderColor: 'border-green-500/50'
    },
    {
      id: 'stress-tester',
      name: 'Stress Tester',
      description: 'Rapid-fire, pressure scenarios',
      icon: <ShieldCheckIcon className="h-7 w-7" />,
      gradient: 'from-red-600 to-red-400',
      borderColor: 'border-red-500/50'
    },
    {
      id: 'theoretical-expert',
      name: 'Theoretical Expert',
      description: 'Concepts, fundamentals, depth',
      icon: <ComputerDesktopIcon className="h-7 w-7" />,
      gradient: 'from-purple-600 to-purple-400',
      borderColor: 'border-purple-500/50'
    }
  ];

  const navigationItems = [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/' },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config', active: true },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history' },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSessionSummary = () => {
    if (!selectedRole || !selectedStyle || !selectedDifficulty) return null;

    const role = jobRoles.find(r => r.id === selectedRole);
    const style = interviewerStyles.find(s => s.id === selectedStyle);
    
    return {
      role: role?.title,
      style: style?.name,
      difficulty: selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1),
      description: `You'll face a ${selectedDifficulty}-level interview for a ${role?.title} position with a ${style?.name.toLowerCase()} interviewer. The AI will ask you 5 questions and provide feedback.`
    };
  };

  const sessionSummary = getSessionSummary();

  const handleBeginInterview = async () => {
    if (!selectedRole || !selectedStyle) {
      console.warn('Please select both a job role and interviewer style');
      return;
    }
    
    if (vapiStatus !== 'ready') {
      console.error('Vapi is not ready. Status:', vapiStatus);
      setVapiError('Interview service is initializing. Please wait a moment and try again.');
      setTimeout(() => setVapiError(null), 3000);
      return;
    }
    
    setIsStartingInterview(true);
    
    try {
      // Get the personality name that matches the ASSISTANT_IDS keys
      const personalityName = PERSONALITY_MAP[selectedStyle];
      const roleName = JOB_ROLE_MAP[selectedRole];
      
      if (!personalityName) {
        throw new Error(`Invalid personality: ${selectedStyle}`);
      }
      
      if (!roleName) {
        throw new Error(`Invalid job role: ${selectedRole}`);
      }
      
      console.log('Starting interview with:', {
        personality: personalityName,
        jobRole: roleName,
        difficulty: selectedDifficulty
      });
      
      // Set up event handlers before starting
      vapiService.onCallStart = () => {
        console.log('Vapi call started');
      };
      
      vapiService.onCallEnd = () => {
        console.log('Vapi call ended');
        setIsStartingInterview(false);
      };
      
      vapiService.onError = (error) => {
        console.error('Vapi error during interview:', error);
        setIsStartingInterview(false);
      };
      
      // Start the Vapi interview
      const result = await vapiService.startInterview(
        personalityName,
        roleName,
        selectedDifficulty
      );
      
      if (result.success) {
        console.log('Interview started successfully:', result);
        // Navigate to the Vapi call session page
        navigate('/vapi-call', {
          state: {
            personality: personalityName,
            jobRole: roleName,
            difficulty: selectedDifficulty,
            callId: result.callId
          }
        });
      } else {
        throw new Error('Failed to start interview');
      }
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      setVapiError(error.message || 'Failed to start interview. Please try again.');
      setTimeout(() => setVapiError(null), 5000);
      setIsStartingInterview(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white flex overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col relative z-10 flex-shrink-0"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <BriefcaseIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Interview Pro
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </motion.button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.name || 'Alex Johnson'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {user?.email || 'alex@example.com'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Configure Interview
            </h1>
            <p className="text-gray-400 text-lg">
              Customize your practice session
            </p>
            {/* Vapi Status Indicator */}
            {vapiStatus === 'initializing' && (
              <div className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                Initializing voice service...
              </div>
            )}
            {vapiStatus === 'ready' && (
              <div className="mt-2 text-sm text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Voice service ready
              </div>
            )}
            {vapiStatus === 'error' && (
              <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                {vapiError || 'Voice service error. Please refresh the page.'}
              </div>
            )}
          </motion.div>

          {/* Job Role Selection */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Select Job Role
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobRoles.map((role) => (
                <JobRoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onClick={() => setSelectedRole(role.id)}
                />
              ))}
            </div>
          </motion.section>

          {/* AI Interviewer Style */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              AI Interviewer Style
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {interviewerStyles.map((style) => (
                <PersonalityCard
                  key={style.id}
                  style={style}
                  selected={selectedStyle === style.id}
                  onClick={() => setSelectedStyle(style.id)}
                />
              ))}
            </div>
          </motion.section>

          {/* Difficulty Level */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Difficulty Level
            </h2>
            <DifficultySelector
              selected={selectedDifficulty}
              onChange={setSelectedDifficulty}
            />
          </motion.section>

          {/* Session Preview */}
          <AnimatePresence>
            {sessionSummary && (
              <motion.section
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SessionPreview 
                  summary={sessionSummary} 
                  onBegin={handleBeginInterview}
                  isStarting={isStartingInterview}
                  isVapiReady={vapiStatus === 'ready'}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// Job Role Card Component
const JobRoleCard = ({ role, selected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer group`}
    >
      {selected && (
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${role.gradient} rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300`}></div>
      )}
      
      <div className={`relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 ${
        selected 
          ? `border-transparent shadow-2xl` 
          : 'border-white/10 hover:border-white/20'
      }`}>
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${role.gradient} mb-3`}>
          {role.icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {role.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {role.description}
        </p>
        
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Personality Card Component
const PersonalityCard = ({ style, selected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {selected && (
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${style.gradient} rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300`}></div>
      )}
      
      <div className={`relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-5 transition-all duration-300 h-full ${
        selected 
          ? 'border-transparent shadow-2xl' 
          : 'border-white/10 hover:border-white/20'
      }`}>
        <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-r ${style.gradient} mb-3`}>
          {style.icon}
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          {style.name}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          {style.description}
        </p>
        
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 h-5 w-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          >
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Difficulty Selector Component
const DifficultySelector = ({ selected, onChange }) => {
  const difficulties = [
    { id: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-500' },
    { id: 'medium', label: 'Medium', color: 'from-yellow-500 to-orange-500' },
    { id: 'hard', label: 'Hard', color: 'from-red-500 to-pink-500' }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="grid grid-cols-3 gap-4">
        {difficulties.map((difficulty) => (
          <motion.button
            key={difficulty.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(difficulty.id)}
            className={`relative py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              selected === difficulty.id
                ? `bg-gradient-to-r ${difficulty.color} text-white shadow-xl`
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {difficulty.label}
            
            {selected === difficulty.id && (
              <motion.div
                layoutId="difficulty-indicator"
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Session Preview Component
const SessionPreview = ({ summary, onBegin, isStarting, isVapiReady }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-white">
            Session Preview
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium">
              {summary.role}
            </span>
            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full font-medium">
              {summary.style}
            </span>
            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full font-medium">
              {summary.difficulty}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-300 mb-6 leading-relaxed">
        {summary.description}
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBegin}
        disabled={isStarting || !isVapiReady}
        className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 flex items-center justify-center space-x-2 group ${
          (isStarting || !isVapiReady) ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-purple-700'
        }`}
      >
        {isStarting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Starting Interview...</span>
          </>
        ) : (
          <>
            <span>Begin Interview</span>
            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </motion.button>
      
      {!isVapiReady && !isStarting && (
        <p className="text-xs text-yellow-400 text-center mt-3">
          Voice service is initializing. Please wait a moment...
        </p>
      )}
    </motion.div>
  );
};

export default InterviewConfig;