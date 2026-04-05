import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  CalendarIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumingId, setResumingId] = useState(null);

  const navigationItems = [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/' },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config' },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history', active: true },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports' },
    { name: 'Admin', icon: <Cog6ToothIcon className="h-5 w-5" />, path: '/admin' }
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/interview/history');
      if (response.data.success) {
        setInterviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleResumeInterview = async (interview) => {
    setResumingId(interview._id);
    try {
      // Fetch the full interview details to get the current state
      const response = await api.get(`/api/interview/${interview._id}`);
      if (response.data.success) {
        const interviewData = response.data.data;
        // Calculate current question number (answers given + 1)
        const answeredQuestions = interviewData.questions.filter(q => q.userAnswer).length;
        const currentQuestion = interviewData.questions[answeredQuestions];
        
        navigate('/interview-session', { 
          state: { 
            resumeId: interview._id,
            role: interview.jobRole,
            style: interview.personality,
            difficulty: interview.difficulty,
            currentQuestionNumber: answeredQuestions + 1,
            currentQuestionText: currentQuestion?.question,
            existingMessages: interviewData.questions
              .filter(q => q.question)
              .flatMap((q, idx) => [
                { role: "ai", text: q.question, timestamp: new Date().toLocaleTimeString() },
                ...(q.userAnswer ? [{ role: "user", text: q.userAnswer, timestamp: new Date().toLocaleTimeString() }] : [])
              ])
          }
        });
      }
    } catch (error) {
      console.error('Error resuming interview:', error);
    } finally {
      setResumingId(null);
    }
  };

  const handleDeleteInterview = async (interviewId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      try {
        await api.delete(`/api/interview/${interviewId}`);
        fetchHistory(); // Refresh the list
      } catch (error) {
        console.error('Error deleting interview:', error);
      }
    }
  };

  // Calculate stats
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const inProgressInterviews = interviews.filter(i => i.status === 'in-progress');
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.report?.overallScore || 0), 0) / completedInterviews.length)
    : 0;

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
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {user?.email || 'user@example.com'}
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
              Interview History
            </h1>
            <p className="text-gray-400 text-lg">
              Review your past interviews or continue where you left off
            </p>
          </motion.div>

          {/* Stats Summary */}
          {!loading && interviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Interviews</p>
                    <p className="text-3xl font-bold text-white">{interviews.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-3xl font-bold text-white">{completedInterviews.length}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <TrophyIcon className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-400">{inProgressInterviews.length}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <PlayIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg. Score</p>
                    <p className="text-3xl font-bold text-white">{avgScore}%</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <SparklesIcon className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* In Progress Section */}
          {!loading && inProgressInterviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <PlayIcon className="h-6 w-6 text-yellow-400" />
                Continue Where You Left Off
              </h2>
              <div className="grid gap-4">
                {inProgressInterviews.map((interview, index) => (
                  <motion.div
                    key={interview._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:bg-yellow-500/15 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-white">
                            {interview.jobRole}
                          </h3>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                            In Progress
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            {interview.personality}
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {interview.difficulty}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(interview.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{new Date(interview.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                            <span className="text-xs">Ready to continue</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResumeInterview(interview)}
                          disabled={resumingId === interview._id}
                          className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/25"
                        >
                          {resumingId === interview._id ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              Resuming...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-4 w-4" />
                              Resume Interview
                            </>
                          )}
                        </motion.button>
                        <button
                          onClick={(e) => handleDeleteInterview(interview._id, e)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Completed Interviews Section */}
          {!loading && completedInterviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <TrophyIcon className="h-6 w-6 text-green-400" />
                Completed Interviews
              </h2>
              <div className="grid gap-4">
                {completedInterviews.map((interview, index) => (
                  <motion.div
                    key={interview._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/interview-report/${interview._id}`)}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-white">
                            {interview.jobRole}
                          </h3>
                          {interview.report?.overallScore && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(interview.report.overallScore)} border`}>
                              Score: {Math.round(interview.report.overallScore)}%
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            {interview.personality}
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {interview.difficulty}
                          </span>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            ✅ Completed
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(interview.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{new Date(interview.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition">
                        <span className="text-sm">View Report</span>
                        <ChevronRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">Loading your interview history...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && interviews.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">No Interviews Yet</h3>
              <p className="text-gray-400 mb-6">Start your first interview to see your history here</p>
              <button
                onClick={() => navigate('/interview-config')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition"
              >
                Start Your First Interview
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default History;