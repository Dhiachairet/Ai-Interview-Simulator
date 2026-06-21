import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileNav from '../components/MobileNav';
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
  TrophyIcon,
  SparklesIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigationItems = [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/' },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config' },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history' },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports', active: true },
    { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile' }
    
  ];
  if (user?.role === 'admin') {
  navigationItems.push({ 
    name: 'Admin', 
    icon: <Cog6ToothIcon className="h-5 w-5" />, 
    path: '/admin' 
  });
}

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/interview/history');
      if (response.data.success) {
        // Only get completed interviews
        const completed = response.data.data.filter(i => i.status === 'completed');
        setInterviews(completed);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate statistics
  const totalInterviews = interviews.length;
  const avgOverallScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.report?.overallScore || 0), 0) / interviews.length)
    : 0;
  
  const avgCommunicationScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.report?.communicationScore || 0), 0) / interviews.length)
    : 0;
  
  const avgTechnicalScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.report?.technicalScore || 0), 0) / interviews.length)
    : 0;

  // Scores by job role
  const scoresByRole = {};
  interviews.forEach(i => {
    const role = i.jobRole;
    const score = i.report?.overallScore || 0;
    if (!scoresByRole[role]) {
      scoresByRole[role] = { total: 0, count: 0 };
    }
    scoresByRole[role].total += score;
    scoresByRole[role].count += 1;
  });

  // Scores by personality
  const scoresByPersonality = {};
  interviews.forEach(i => {
    const personality = i.personality;
    const score = i.report?.overallScore || 0;
    if (!scoresByPersonality[personality]) {
      scoresByPersonality[personality] = { total: 0, count: 0 };
    }
    scoresByPersonality[personality].total += score;
    scoresByPersonality[personality].count += 1;
  });

  // Scores by difficulty
  const scoresByDifficulty = {
    easy: { total: 0, count: 0 },
    medium: { total: 0, count: 0 },
    hard: { total: 0, count: 0 }
  };
  interviews.forEach(i => {
    const diff = i.difficulty?.toLowerCase() || 'medium';
    const score = i.report?.overallScore || 0;
    if (scoresByDifficulty[diff]) {
      scoresByDifficulty[diff].total += score;
      scoresByDifficulty[diff].count += 1;
    }
  });

  // Confidence level distribution
  const confidenceLevels = { Low: 0, Medium: 0, High: 0 };
  interviews.forEach(i => {
    const level = i.report?.confidenceLevel || 'Medium';
    confidenceLevels[level] = (confidenceLevels[level] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading reports...</p>
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
              Performance Reports
            </h1>
            <p className="text-gray-400 text-lg">
              Track your interview performance and progress over time
            </p>
          </motion.div>

          {/* Stats Overview */}
          {totalInterviews > 0 ? (
            <>
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
                      <p className="text-3xl font-bold text-white">{totalInterviews}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Overall Score</p>
                      <p className="text-3xl font-bold text-white">{avgOverallScore}%</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <TrophyIcon className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Communication</p>
                      <p className="text-3xl font-bold text-white">{avgCommunicationScore}%</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Technical</p>
                      <p className="text-3xl font-bold text-white">{avgTechnicalScore}%</p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <SparklesIcon className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scores by Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* By Job Role */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5 text-blue-400" />
                    By Job Role
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(scoresByRole).map(([role, data]) => (
                      <div key={role}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{role}</span>
                          <span>{Math.round(data.total / data.count)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${data.total / data.count}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* By Personality */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserCircleIcon className="h-5 w-5 text-purple-400" />
                    By Interviewer
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(scoresByPersonality).map(([personality, data]) => (
                      <div key={personality}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{personality}</span>
                          <span>{Math.round(data.total / data.count)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: `${data.total / data.count}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Difficulty & Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* By Difficulty */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-400" />
                    By Difficulty
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(scoresByDifficulty).filter(([_, data]) => data.count > 0).map(([difficulty, data]) => (
                      <div key={difficulty}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{difficulty}</span>
                          <span>{Math.round(data.total / data.count)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r h-2 rounded-full ${
                              difficulty === 'easy' ? 'from-green-500 to-emerald-500' :
                              difficulty === 'medium' ? 'from-yellow-500 to-orange-500' :
                              'from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${data.total / data.count}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Confidence Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ChartPieIcon className="h-5 w-5 text-green-400" />
                    Confidence Level
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(confidenceLevels).map(([level, count]) => (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{level}</span>
                          <span>{count} interviews</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              level === 'Low' ? 'bg-red-500' :
                              level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(count / totalInterviews) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Recent Interviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Recent Interviews</h2>
                <div className="space-y-3">
                  {interviews.slice(0, 5).map((interview, idx) => (
                    <div 
                      key={interview._id}
                      onClick={() => navigate(`/interview-report/${interview._id}`)}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition"
                    >
                      <div>
                        <p className="font-medium">{interview.jobRole}</p>
                        <p className="text-sm text-gray-400">{new Date(interview.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">{Math.round(interview.report?.overallScore || 0)}%</p>
                        <p className="text-xs text-gray-500">{interview.personality}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
            >
              <ChartBarIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">No Reports Yet</h3>
              <p className="text-gray-400 mb-6">Complete interviews to see your performance analytics here</p>
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
    </div>
  );
};

export default Reports;