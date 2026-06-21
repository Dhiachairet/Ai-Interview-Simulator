import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/DialogProvider';
import MobileNav from '../components/MobileNav';
import api from '../services/api';
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
  ArrowRightOnRectangleIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import vapiService from '../services/vapiService';
import { iconComponents } from '../constants/iconMap';

// Map UI IDs to personality names (must match ASSISTANT_IDS keys in vapiService)
const PERSONALITY_MAP = {
  'strict-technical': 'Strict Technical',
  'friendly-hr': 'Friendly HR',
  'stress-tester': 'Stress Tester',
  'theoretical-expert': 'Theoretical Expert'
};

const InterviewConfig = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [vapiStatus, setVapiStatus] = useState('idle');
  const [vapiError, setVapiError] = useState(null);
  
  // Dynamic job roles from database
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Resume states
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [useResumeContext, setUseResumeContext] = useState(false);
  const [resumeMode, setResumeMode] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);

  // Fetch job roles from database
  useEffect(() => {
    fetchJobRoles();
    loadExistingResume();
  }, []);

  const fetchJobRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await api.get('/api/job-roles');
      if (response.data.success && response.data.data.length > 0) {
        setJobRoles(response.data.data);
      } else {
        setJobRoles(fallbackJobRoles);
      }
    } catch (error) {
      console.error('Failed to fetch job roles:', error);
      setJobRoles(fallbackJobRoles);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadExistingResume = async () => {
    try {
      const response = await api.get('/api/resume');
      if (response.data.success && response.data.data) {
        const resumeData = response.data.data.parsedData;
        setParsedResume(resumeData);
        setResumeMode(true);
        setUseResumeContext(true);
        if (resumeData.detectedJobRole) setDetectedRole(resumeData.detectedJobRole);
      }
    } catch (error) {
      console.error('Failed to load existing resume:', error);
    }
  };

  const handleResumeUpload = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    setUploadingResume(true);
    setResumeFile(file);
    
    try {
      const response = await api.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const resumeData = response.data.data.parsedData;
        setParsedResume(resumeData);
        if (resumeData.detectedJobRole) setDetectedRole(resumeData.detectedJobRole);
        setResumeMode(true);
        setUseResumeContext(true);
        console.log('✅ Resume parsed successfully');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResume = async () => {
    try {
      await api.delete('/api/resume');
      setParsedResume(null);
      setResumeFile(null);
      setResumeMode(false);
      setUseResumeContext(false);
      setDetectedRole(null);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  // Fallback static roles (in case DB is empty)
  const fallbackJobRoles = [
    { _id: 'hr-manager', name: 'HR Manager', description: 'People management, culture', iconName: 'UserGroupIcon', gradient: 'from-pink-500 to-rose-500' },
    { _id: 'frontend', name: 'Frontend Developer', description: 'React, CSS, JavaScript', iconName: 'CodeBracketIcon', gradient: 'from-blue-500 to-cyan-500' },
    { _id: 'backend', name: 'Backend Developer', description: 'Node.js, APIs, Databases', iconName: 'ServerIcon', gradient: 'from-green-500 to-emerald-500' },
    { _id: 'product-manager', name: 'Product Manager', description: 'Strategy, roadmaps, metrics', iconName: 'CubeIcon', gradient: 'from-purple-500 to-violet-500' },
    { _id: 'data-scientist', name: 'Data Scientist', description: 'ML, analytics, Python', iconName: 'ChartPieIcon', gradient: 'from-orange-500 to-amber-500' }
  ];

  // Helper function to get icon component
  const getIconComponent = (iconName, className = "h-8 w-8") => {
    const Icon = iconComponents[iconName];
    return Icon ? <Icon className={className} /> : <BriefcaseIcon className={className} />;
  };

  // Initialize Vapi on component mount
  useEffect(() => {
    const initVapi = async () => {
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      
      if (!publicKey) {
        console.error('VITE_VAPI_PUBLIC_KEY not found');
        setVapiStatus('error');
        setVapiError('Vapi configuration missing');
        return;
      }
      
      setVapiStatus('initializing');
      
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
    
    return () => {
      if (vapiService.isActive()) {
        vapiService.stopInterview();
      }
    };
  }, []);

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
    { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile' }
  ];
  
  if (user?.role === 'admin') {
    navigationItems.push({ 
      name: 'Admin', 
      icon: <Cog6ToothIcon className="h-5 w-5" />, 
      path: '/admin' 
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSessionSummary = () => {
    // If using resume mode, show resume-based summary
    if (resumeMode && useResumeContext && parsedResume) {
      return {
        role: parsedResume.detectedJobRole || 'Your Profile',
        style: selectedStyle ? interviewerStyles.find(s => s.id === selectedStyle)?.name : 'Not selected',
        difficulty: selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1),
        description: `You'll face a ${selectedDifficulty}-level interview based on your resume. The AI will ask personalized questions about your skills in ${parsedResume.skills?.slice(0, 3).join(', ') || 'various areas'} and your experience${parsedResume.experience?.length > 0 ? ` at ${parsedResume.experience[0]?.company}` : ''}.`
      };
    }
    
    // Otherwise use selected job role
    if (!selectedRole || !selectedStyle || !selectedDifficulty) return null;
    const role = jobRoles.find(r => r._id === selectedRole || r.name === selectedRole);
    const style = interviewerStyles.find(s => s.id === selectedStyle);
    return {
      role: role?.name || selectedRole,
      style: style?.name,
      difficulty: selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1),
      description: `You'll face a ${selectedDifficulty}-level interview for a ${role?.name || selectedRole} position with a ${style?.name.toLowerCase()} interviewer. The AI will ask you questions and provide feedback.`
    };
  };

  const sessionSummary = getSessionSummary();

  const handleBeginInterview = async () => {
    // Validate: either resume mode with context OR selected role
    if (!resumeMode && !selectedRole) {
      toast.warning('Please either select a job role or upload a resume');
      return;
    }
    
    if (!selectedStyle) {
      toast.warning('Please select an interviewer style');
      return;
    }
    
    if (vapiStatus !== 'ready') {
      setVapiError('Interview service is initializing. Please wait a moment.');
      setTimeout(() => setVapiError(null), 3000);
      return;
    }
    
    setIsStartingInterview(true);
    
    try {
      const personalityName = PERSONALITY_MAP[selectedStyle];
      let roleName;
      
      // Determine job role - either from resume or selected role
      if (resumeMode && useResumeContext && parsedResume) {
        roleName = parsedResume.detectedJobRole || 'Software Developer';
        console.log('📄 Using resume-detected role:', roleName);
      } else if (selectedRole) {
        const selectedRoleObj = jobRoles.find(r => r._id === selectedRole);
        roleName = selectedRoleObj?.name || selectedRole;
      } else {
        throw new Error('No job role selected or detected');
      }
      
      if (!personalityName) throw new Error(`Invalid personality: ${selectedStyle}`);
      
      console.log('Starting interview with:', {
        personality: personalityName,
        jobRole: roleName,
        difficulty: selectedDifficulty,
        usingResumeContext: resumeMode && useResumeContext && !!parsedResume
      });
      
      // Set up call-end handler
      vapiService.onCallEnd = async (vapiCallId) => {
        console.log('Vapi call ended, saving call ID:', vapiCallId);
        if (vapiCallId) {
          try {
            await api.post('/api/interview/save-vapi-call', { 
              vapiCallId,
              fallbackMetadata: { jobRole: roleName, personality: personalityName, difficulty: selectedDifficulty }
            });
          } catch (error) { console.error('Failed to save call:', error); }
        }
        setIsStartingInterview(false);
      };
      
      vapiService.onError = (error) => {
        console.error('Vapi error during interview:', error);
        setIsStartingInterview(false);
      };
      
      // Start interview with or without resume data
      const result = await vapiService.startInterview(
        personalityName,
        roleName,
        selectedDifficulty,
        (resumeMode && useResumeContext && parsedResume) ? parsedResume : null
      );
      
      if (result.success) {
        navigate('/vapi-call', {
          state: {
            personality: personalityName,
            jobRole: roleName,
            difficulty: selectedDifficulty,
            callId: result.callId,
            hasResumeContext: resumeMode && useResumeContext && !!parsedResume
          }
        });
      } else {
        throw new Error('Failed to start interview');
      }
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      setVapiError(error.message || 'Failed to start interview.');
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
      <MobileNav
        items={navigationItems}
        user={user}
        onLogout={handleLogout}
        headerIcon={<BriefcaseIcon className="h-6 w-6 text-white" />}
        headerTitle="AI Interview Pro"
      />

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl flex-col relative z-10 flex-shrink-0"
      >
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

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name || 'User'}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email || 'user@example.com'}</p>
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
      <main className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0">
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
              Customize your practice session or upload your resume for personalized questions
            </p>
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

          {/* Resume Upload Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Upload Your Resume
            </h2>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              
              {!parsedResume ? (
                <div className="text-center">
                  <label className="cursor-pointer inline-flex flex-col items-center group">
                    <div className="p-5 bg-blue-500/20 rounded-full mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                      <DocumentArrowUpIcon className="h-10 w-10 text-blue-400" />
                    </div>
                    <span className="text-white font-medium mb-1">Upload Resume / CV</span>
                    <span className="text-gray-400 text-sm">PDF or DOCX (Max 5MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => handleResumeUpload(e.target.files[0])}
                      className="hidden"
                      disabled={uploadingResume}
                    />
                  </label>
                  {uploadingResume && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Analyzing resume...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {parsedResume.name || 'Resume Uploaded'}
                        </h3>
                        <p className="text-sm text-gray-400">{resumeFile?.name || 'Resume file'}</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveResume} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {parsedResume.detectedJobRole && (
                    <div className="bg-blue-500/10 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-400 mb-1">Detected Job Role</p>
                      <p className="text-white font-medium">{parsedResume.detectedJobRole}</p>
                      
                    </div>
                  )}
                  
                  {parsedResume.skills?.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-400 mb-2">Key Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedResume.skills.slice(0, 8).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <input
                      type="checkbox"
                      id="useResumeContext"
                      checked={useResumeContext}
                      onChange={(e) => setUseResumeContext(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 accent-blue-500"
                    />
                    <label htmlFor="useResumeContext" className="text-sm text-gray-300 cursor-pointer">
                      Personalize interview questions based on my resume
                    </label>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* OR Divider */}
          {!parsedResume && (
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1.5 bg-white/10 rounded-full text-gray-400 text-xs uppercase tracking-wider">
                  Or
                </span>
              </div>
            </div>
          )}

          {/* Job Role Selection - Only show if no resume OR resume not using context */}
          {(!parsedResume || !useResumeContext) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Select Job Role
              </h2>
              {loadingRoles ? (
                <div className="text-center text-gray-400 py-8">Loading job roles...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobRoles.map((role) => (
                    <JobRoleCard
                      key={role._id}
                      role={role}
                      selected={selectedRole === role._id}
                      onClick={() => setSelectedRole(role._id)}
                      getIconComponent={getIconComponent}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          )}

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
            {sessionSummary && ((!parsedResume && selectedRole && selectedStyle) || (parsedResume && useResumeContext && selectedStyle)) && (
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

// Updated Job Role Card Component
const JobRoleCard = ({ role, selected, onClick, getIconComponent }) => {
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
          {getIconComponent(role.iconName, "h-8 w-8 text-white")}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {role.name}
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
            className={`relative py-4 px-3 sm:px-6 rounded-xl font-semibold transition-all duration-300 ${
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