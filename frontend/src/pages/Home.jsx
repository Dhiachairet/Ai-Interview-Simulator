import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon ,
  HomeIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    interviews: [],
    stats: {
      total: 0,
      completed: 0,
      avgScore: 0,
      improving: false,
      streak: 0,
      bestScore: 0,
      bestPersonality: '',
      bestRole: ''
    },
    personalityScores: {},
    roleScores: {},
    recentImprovement: 0
  });
  const [loading, setLoading] = useState(true);

  const navigationItems = [
  { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/', active: true },
  { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config' },
  { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history' },
  { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports' },
  { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile' },
];


if (user?.role === 'admin') {
  navigationItems.push({ 
    name: 'Admin', 
    icon: <Cog6ToothIcon className="h-5 w-5" />, 
    path: '/admin' 
  });
}

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    if (isAuthenticated) {
      fetchDashboardData();
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/interview/history');
      if (response.data.success) {
        const allInterviews = response.data.data;
        const completed = allInterviews.filter(i => i.status === 'completed');
        
        let streak = 0;
        if (completed.length > 0) {
          const dates = [...new Set(completed.map(i => new Date(i.createdAt).toDateString()))];
          dates.sort((a, b) => new Date(b) - new Date(a));
          
          let currentStreak = 1;
          for (let i = 0; i < dates.length - 1; i++) {
            const diffDays = Math.ceil((new Date(dates[i]) - new Date(dates[i + 1])) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
          streak = currentStreak;
        }
        
        let bestScore = 0;
        let bestPersonality = '';
        let bestRole = '';
        
        const personalityScores = {};
        const roleScores = {};
        
        completed.forEach(i => {
          const score = i.report?.overallScore || 0;
          
          if (score > bestScore) {
            bestScore = score;
            bestPersonality = i.personality;
            bestRole = i.jobRole;
          }
          
          if (!personalityScores[i.personality]) {
            personalityScores[i.personality] = { total: 0, count: 0 };
          }
          personalityScores[i.personality].total += score;
          personalityScores[i.personality].count += 1;
          
          if (!roleScores[i.jobRole]) {
            roleScores[i.jobRole] = { total: 0, count: 0 };
          }
          roleScores[i.jobRole].total += score;
          roleScores[i.jobRole].count += 1;
        });
        
        let recentImprovement = 0;
        if (completed.length >= 6) {
          const last3 = completed.slice(-3).map(i => i.report?.overallScore || 0);
          const prev3 = completed.slice(-6, -3).map(i => i.report?.overallScore || 0);
          const avgLast3 = last3.reduce((a, b) => a + b, 0) / 3;
          const avgPrev3 = prev3.reduce((a, b) => a + b, 0) / 3;
          recentImprovement = Math.round(avgLast3 - avgPrev3);
        }
        
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((acc, i) => acc + (i.report?.overallScore || 0), 0) / completed.length)
          : 0;
        
        setDashboardData({
          interviews: completed.slice(-5).reverse(),
          stats: {
            total: allInterviews.length,
            completed: completed.length,
            avgScore: avgScore,
            improving: recentImprovement > 0,
            streak: streak,
            bestScore: bestScore,
            bestPersonality: bestPersonality,
            bestRole: bestRole
          },
          personalityScores: personalityScores,
          roleScores: roleScores,
          recentImprovement: recentImprovement
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPersonalityIcon = (personality) => {
    switch(personality) {
      case 'Strict Technical': return <CodeBracketIcon className="h-4 w-4" />;
      case 'Friendly HR': return <UserGroupIcon className="h-4 w-4" />;
      case 'Stress Tester': return <BoltIcon className="h-4 w-4" />;
      case 'Theoretical Expert': return <AcademicCapIcon className="h-4 w-4" />;
      default: return <UserCircleIcon className="h-4 w-4" />;
    }
  };

  const features = [
    {
      icon: <MicrophoneIcon className="h-8 w-8" />,
      title: "Voice Interaction",
      description: "Natural conversations with real-time voice recognition",
      gradient: "from-blue-400 to-cyan-400",
      delay: 0.1
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "AI Personalities",
      description: "Choose from 4 unique interviewer styles",
      gradient: "from-purple-400 to-pink-400",
      delay: 0.2
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: "Smart Feedback",
      description: "Detailed AI-powered performance analysis",
      gradient: "from-orange-400 to-red-400",
      delay: 0.3
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Watch your improvement over time",
      gradient: "from-green-400 to-emerald-400",
      delay: 0.4
    }
  ];

  const personalities = [
    {
      name: "Strict Technical",
      role: "The Expert",
      description: "Deep technical questions with critical evaluation",
      color: "from-blue-600 to-blue-400",
      icon: <BoltIcon className="h-6 w-6" />
    },
    {
      name: "Friendly HR",
      role: "The Mentor",
      description: "Behavioral questions with encouraging feedback",
      color: "from-green-600 to-green-400",
      icon: <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
    },
    {
      name: "Stress Tester",
      role: "The Challenger",
      description: "Rapid questions under pressure",
      color: "from-red-600 to-red-400",
      icon: <ShieldCheckIcon className="h-6 w-6" />
    },
    {
      name: "Theoretical Expert",
      role: "The Professor",
      description: "Deep conceptual discussions",
      color: "from-purple-600 to-purple-400",
      icon: <ComputerDesktopIcon className="h-6 w-6" />
    }
  ];

  const stats = [
    { value: "98%", label: "Success Rate" },
    { value: "10k+", label: "Interviews Completed" },
    { value: "4.9", label: "User Rating" },
    { value: "15min", label: "Average Session" }
  ];

  // ========== DASHBOARD FOR LOGGED-IN USERS ==========
  if (isAuthenticated) {
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

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-6xl mx-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-400">Your interview journey at a glance</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <FireIcon className="h-6 w-6 text-orange-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">{dashboardData.stats.streak}</span>
                </div>
                <h3 className="text-gray-400 text-sm">Current Streak</h3>
                <p className="text-xs text-gray-500 mt-1">Consecutive days with interviews</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <TrophyIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">{dashboardData.stats.bestScore}%</span>
                </div>
                <h3 className="text-gray-400 text-sm">Best Score</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData.stats.bestPersonality} · {dashboardData.stats.bestRole}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className={`text-3xl font-bold ${dashboardData.recentImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardData.recentImprovement >= 0 ? '+' : ''}{dashboardData.recentImprovement}%
                  </span>
                </div>
                <h3 className="text-gray-400 text-sm">Improvement</h3>
                <p className="text-xs text-gray-500 mt-1">Last 3 vs previous 3 interviews</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">{dashboardData.stats.completed}</span>
                </div>
                <h3 className="text-gray-400 text-sm">Completed</h3>
                <p className="text-xs text-gray-500 mt-1">Out of {dashboardData.stats.total} total</p>
              </motion.div>
            </div>

            {/* Performance by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserCircleIcon className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Interviewer Performance</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(dashboardData.personalityScores)
                    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                    .map(([personality, data]) => {
                      const avgScore = Math.round(data.total / data.count);
                      return (
                        <div key={personality} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPersonalityIcon(personality)}
                            <span className="text-sm">{personality}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-white/10 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  avgScore >= 80 ? 'bg-green-500' : avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${avgScore}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getScoreColor(avgScore)}`}>
                              {avgScore}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BriefcaseIcon className="h-5 w-5 text-green-400" />
                  <h2 className="text-lg font-semibold">Role Performance</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(dashboardData.roleScores)
                    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                    .slice(0, 5)
                    .map(([role, data]) => {
                      const avgScore = Math.round(data.total / data.count);
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[150px]">{role}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-white/10 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  avgScore >= 80 ? 'bg-green-500' : avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${avgScore}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getScoreColor(avgScore)}`}>
                              {avgScore}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : dashboardData.interviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="h-10 w-10 text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-4">No interviews yet</p>
                  <button
                    onClick={() => navigate('/interview-config')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-sm"
                  >
                    Start Your First Interview
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.interviews.map((interview, idx) => (
                    <motion.div
                      key={interview._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/interview-report/${interview._id}`)}
                      className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          (interview.report?.overallScore || 0) >= 80 ? 'bg-green-500/20' :
                          (interview.report?.overallScore || 0) >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                          <CheckCircleIcon className={`h-5 w-5 ${
                            (interview.report?.overallScore || 0) >= 80 ? 'text-green-400' :
                            (interview.report?.overallScore || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-400 transition">{interview.jobRole}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {getPersonalityIcon(interview.personality)}
                            <span className="text-xs text-gray-500">{interview.personality}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{formatDate(interview.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getScoreColor(interview.report?.overallScore)}`}>
                          {Math.round(interview.report?.overallScore || 0)}%
                        </p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
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
  }

  // ========== MARKETING PAGE FOR NON-LOGGED-IN USERS ==========
  return (
    <div className="min-h-screen w-full bg-[#0A0F1E] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0A0F1E]/80 backdrop-blur-lg border-b border-white/10' : ''
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 max-w-7xl mx-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <SparklesIcon className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Interview Pro
              </span>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative w-full pt-32 pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400 mb-8">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  AI-Powered Interview Preparation
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-6"
              >
                Master Your Next
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Job Interview
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
              >
                Practice with our intelligent AI interviewer. Get real-time feedback, 
                improve your responses, and land your dream job with confidence.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-medium overflow-hidden"
                  >
                    <span className="relative z-10">Start Practicing Now</span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                      initial={{ x: "100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-lg font-medium hover:bg-white/10 transition"
                >
                  Watch Demo <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Features Section */}
            <div className="mt-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Everything You Need to
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Ace Your Interview
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Our AI-powered platform provides all the tools you need to prepare effectively
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: feature.delay }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradient.split(' ')[1]} 0%, ${feature.gradient.split(' ')[3]} 100%)`
                      }}
                    />
                    <div className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Personalities Section */}
            <div className="mt-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Choose Your
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI Interviewer
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Each personality has unique questioning style and feedback approach
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {personalities.map((personality, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    className="group cursor-pointer"
                  >
                    <div className={`relative p-6 bg-gradient-to-br ${personality.color} rounded-2xl overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            {personality.icon}
                          </div>
                          <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            {personality.role}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{personality.name}</h3>
                        <p className="text-sm text-white/80">{personality.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-32"
            >
              <div className="relative p-12 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />
                <div className="absolute inset-0 bg-black/20" />
                
                <div className="relative z-10 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to Start Your Journey?
                  </h2>
                  <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                    Join thousands of successful job seekers who mastered their interviews with us
                  </p>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-medium hover:shadow-2xl transition"
                    >
                      Create Free Account
                      <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
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

export default Home;