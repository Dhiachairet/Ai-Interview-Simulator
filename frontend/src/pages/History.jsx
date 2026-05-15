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
  ArrowPathIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobRole, setSelectedJobRole] = useState('all');
  const [selectedPersonality, setSelectedPersonality] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [personalities, setPersonalities] = useState([]);

  const isAdmin = user?.role === 'admin';

  const navigationItems = [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/' },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config' },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history', active: true },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports' },
    { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile' }
  ];
  
  if (isAdmin) {
    navigationItems.push({ 
      name: 'Admin', 
      icon: <Cog6ToothIcon className="h-5 w-5" />, 
      path: '/admin' 
    });
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedJobRole, selectedPersonality, dateRange, interviews]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/interview/history');
      
      if (response.data.success) {
        const formattedInterviews = response.data.data.map(interview => {
          let score = 0;
          if (interview.report?.overallScore && interview.report.overallScore > 0) {
            score = interview.report.overallScore;
          } else if (interview.overallScore && interview.overallScore > 0) {
            score = interview.overallScore;
          } else if (interview.questions?.length > 0) {
            const scores = interview.questions.filter(q => q.score && q.score > 0).map(q => q.score);
            if (scores.length > 0) {
              score = scores.reduce((a, b) => a + b, 0) / scores.length;
            }
          }
          
          let displayStatus = 'other';
          if (interview.status === 'evaluating') {
            displayStatus = 'evaluating';
          } else if (interview.status === 'completed') {
            displayStatus = 'completed';
          } else {
            return null;
          }
          
          return {
            ...interview,
            displayScore: Math.round(score),
            displayStatus: displayStatus,
            questionCount: interview.questions?.length || 0,
            answeredCount: interview.questions?.filter(q => q.userAnswer).length || 0,
            formattedDate: new Date(interview.createdAt),
            dateString: new Date(interview.createdAt).toISOString().split('T')[0]
          };
        }).filter(interview => interview !== null);
        
        formattedInterviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInterviews(formattedInterviews);
        
        const uniqueRoles = [...new Set(formattedInterviews.map(i => i.jobRole))];
        const uniquePersonalities = [...new Set(formattedInterviews.map(i => i.personality))];
        setJobRoles(uniqueRoles);
        setPersonalities(uniquePersonalities);
        
        setError(null);
      } else {
        setError('Failed to load interview history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError(error.response?.data?.error || 'Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interviews];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.jobRole?.toLowerCase().includes(term) ||
        i.personality?.toLowerCase().includes(term) ||
        i.difficulty?.toLowerCase().includes(term)
      );
    }
    
    if (selectedJobRole !== 'all') {
      filtered = filtered.filter(i => i.jobRole === selectedJobRole);
    }
    
    if (selectedPersonality !== 'all') {
      filtered = filtered.filter(i => i.personality === selectedPersonality);
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.setDate(now.getDate() - 7));
    const thisMonth = new Date(now.setMonth(now.getMonth() - 1));
    
    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(i => new Date(i.createdAt) >= today);
        break;
      case 'week':
        filtered = filtered.filter(i => new Date(i.createdAt) >= thisWeek);
        break;
      case 'month':
        filtered = filtered.filter(i => new Date(i.createdAt) >= thisMonth);
        break;
      default:
        break;
    }
    
    setFilteredInterviews(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJobRole('all');
    setSelectedPersonality('all');
    setDateRange('all');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (!score || score === 0) return 'bg-gray-500/20 border-gray-500/30';
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleViewReport = (interviewId) => {
    navigate(`/interview-report/${interviewId}`);
  };

  const handleDeleteInterview = async (interviewId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      setDeletingId(interviewId);
      try {
        await api.delete(`/api/interview/${interviewId}`);
        await fetchHistory();
      } catch (error) {
        console.error('Error deleting interview:', error);
        alert('Failed to delete interview');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStartNewInterview = () => {
    navigate('/interview-config');
  };

  const completedInterviews = filteredInterviews.filter(i => i.displayStatus === 'completed');
  const evaluatingInterviews = filteredInterviews.filter(i => i.displayStatus === 'evaluating');
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.displayScore || 0), 0) / completedInterviews.length)
    : 0;

  const hasActiveFilters = searchTerm !== '' || selectedJobRole !== 'all' || selectedPersonality !== 'all' || dateRange !== 'all';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading your interview history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              Review your completed interviews and track your progress
            </p>
          </motion.div>

          {/* Stats Summary */}
          {interviews.length > 0 && (
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
                    <p className="text-gray-400 text-sm">Avg. Score</p>
                    <p className="text-3xl font-bold text-white">{avgScore}%</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <SparklesIcon className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Showing</p>
                    <p className="text-3xl font-bold text-white">{filteredInterviews.length}</p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <FunnelIcon className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by job role, personality, or difficulty..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Job Role Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Job Role
    </label>
    <select
      value={selectedJobRole}
      onChange={(e) => setSelectedJobRole(e.target.value)}
      className="w-full px-4 py-2 rounded-lg bg-[#1a1f35] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      style={{ backgroundColor: '#1a1f35' }}
    >
      <option value="all" className="bg-[#1a1f35] text-white">All Roles</option>
      {jobRoles.map(role => (
        <option key={role} value={role} className="bg-[#1a1f35] text-white">
          {role}
        </option>
      ))}
    </select>
  </div>

  {/* Personality Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Interviewer Style
    </label>
    <select
      value={selectedPersonality}
      onChange={(e) => setSelectedPersonality(e.target.value)}
      className="w-full px-4 py-2 rounded-lg bg-[#1a1f35] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      style={{ backgroundColor: '#1a1f35' }}
    >
      <option value="all" className="bg-[#1a1f35] text-white">All Personalities</option>
      {personalities.map(personality => (
        <option key={personality} value={personality} className="bg-[#1a1f35] text-white">
          {personality}
        </option>
      ))}
    </select>
  </div>

  {/* Date Range Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Date Range
    </label>
    <select
      value={dateRange}
      onChange={(e) => setDateRange(e.target.value)}
      className="w-full px-4 py-2 rounded-lg bg-[#1a1f35] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      style={{ backgroundColor: '#1a1f35' }}
    >
      <option value="all" className="bg-[#1a1f35] text-white">All Time</option>
      <option value="today" className="bg-[#1a1f35] text-white">Today</option>
      <option value="week" className="bg-[#1a1f35] text-white">Last 7 Days</option>
      <option value="month" className="bg-[#1a1f35] text-white">Last 30 Days</option>
    </select>
  </div>
</div>

                  {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-wrap gap-2">
                          {searchTerm && (
                            <span className="px-3 py-1.5 bg-blue-500/20 rounded-lg text-sm text-blue-400 flex items-center gap-2">
                              Search: {searchTerm}
                              <button onClick={() => setSearchTerm('')}>
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          {selectedJobRole !== 'all' && (
                            <span className="px-3 py-1.5 bg-purple-500/20 rounded-lg text-sm text-purple-400 flex items-center gap-2">
                              Role: {selectedJobRole}
                              <button onClick={() => setSelectedJobRole('all')}>
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          {selectedPersonality !== 'all' && (
                            <span className="px-3 py-1.5 bg-green-500/20 rounded-lg text-sm text-green-400 flex items-center gap-2">
                              Style: {selectedPersonality}
                              <button onClick={() => setSelectedPersonality('all')}>
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          {dateRange !== 'all' && (
                            <span className="px-3 py-1.5 bg-yellow-500/20 rounded-lg text-sm text-yellow-400 flex items-center gap-2">
                              Date: {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                              <button onClick={() => setDateRange('all')}>
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Count */}
          {filteredInterviews.length > 0 && (
            <div className="mb-4 text-sm text-gray-400">
              Found {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* Evaluating Section */}
          {evaluatingInterviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <ArrowPathIcon className="h-6 w-6 text-purple-400 animate-spin" />
                Processing ({evaluatingInterviews.length})
              </h2>
              <div className="grid gap-4">
                {evaluatingInterviews.map((interview, index) => (
                  <motion.div
                    key={interview._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-white">
                            {interview.jobRole}
                          </h3>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                            Analyzing...
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
                        </div>
                        <p className="text-xs text-gray-500 mt-2">AI is analyzing your responses. This should complete shortly.</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Completed Interviews Section */}
          {completedInterviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <TrophyIcon className="h-6 w-6 text-green-400" />
                Completed ({completedInterviews.length})
              </h2>
              <div className="grid gap-4">
                {completedInterviews.map((interview, index) => (
                  <motion.div
                    key={interview._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-xl font-semibold text-white">
                            {interview.jobRole}
                          </h3>
                          {interview.displayScore > 0 && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(interview.displayScore)} border`}>
                              Score: {interview.displayScore}%
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
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(interview.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{new Date(interview.createdAt).toLocaleTimeString()}</span>
                          </div>
                          {interview.answeredCount > 0 && (
                            <div className="flex items-center gap-1">
                              <DocumentTextIcon className="h-4 w-4" />
                              <span>{interview.answeredCount} answers</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Delete button - ONLY for admins */}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteInterview(interview._id, e)}
                            disabled={deletingId === interview._id}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition disabled:opacity-50"
                            title="Delete interview"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewReport(interview._id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition group"
                        >
                          <span className="text-sm">View Report</span>
                          <ChevronRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State - No Matching Filters */}
          {filteredInterviews.length === 0 && interviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6">
                <FunnelIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">No Matching Interviews</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters to see more results</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition"
              >
                Clear Filters
              </button>
            </motion.div>
          )}

          {/* Empty State - No Interviews */}
          {interviews.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">No Completed Interviews Yet</h3>
              <p className="text-gray-400 mb-6">Complete your first interview to see your history here</p>
              <button
                onClick={handleStartNewInterview}
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