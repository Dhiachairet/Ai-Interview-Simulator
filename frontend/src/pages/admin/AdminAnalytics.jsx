import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  MicrophoneIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  HomeIcon,
  Cog6ToothIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [systemStats, setSystemStats] = useState({
    totalInterviews: 0,
    avgOverallScore: 0,
    totalDuration: 0,
    activeUsers30d: 0,
    interviewsByPersonality: {},
    interviewsByRole: {},
    recentActivity: []
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [userStats, setUserStats] = useState({ total: 0, activeUsers: 0, admins: 0 });

  const navigationItems = [
    { name: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" />, path: '/admin', active: true },
    { name: 'Users', icon: <UserGroupIcon className="h-5 w-5" />, path: '/admin/users' },
    { name: 'Interviews', icon: <DocumentTextIcon className="h-5 w-5" />, path: '/admin/interviews' },
    { name: 'Vapi Settings', icon: <MicrophoneIcon className="h-5 w-5" />, path: '/admin/vapi-settings' },
    { name: 'Profile', icon: <HomeIcon className="h-5 w-5" />, path: '/profile' },
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchSystemStats();
    fetchUserStats();
  }, [user]);

  const fetchSystemStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminService.getSystemStats();
      if (response.success) {
        setSystemStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await adminService.listUsers({});
      if (response.success) {
        const users = response.data || [];
        const admins = users.filter((item) => item.role === 'admin').length;
        const suspendedUsers = users.filter((item) => item.status === 'suspended').length;
        const activeUsers = users.length - suspendedUsers;
        setUserStats({ total: users.length, activeUsers, admins });
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
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

  const getTopPerformer = () => {
    const entries = Object.entries(systemStats.interviewsByPersonality || {});
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  const getTopRole = () => {
    const entries = Object.entries(systemStats.interviewsByRole || {});
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  const topPerformer = getTopPerformer();
  const topRole = getTopRole();

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
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Console
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
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {user?.email || 'admin@example.com'}
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

      {/* Main Content - Analytics */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300/70">Admin Panel</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Platform Analytics</h1>
            <p className="text-gray-400 mt-2">View system-wide performance and usage statistics</p>
          </div>

          {/* Main Stats Cards - 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <UsersIcon className="h-6 w-6 text-blue-400" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl font-bold text-white">{userStats.total}</span>
                )}
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
              <p className="text-xs text-gray-500 mt-1">{userStats.activeUsers} active accounts</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(userStats.activeUsers / (userStats.total || 1)) * 100}%` }} />
              </div>
            </div>

            {/* Admins Card - Keep as is */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl p-6 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl font-bold text-white">{userStats.admins}</span>
                )}
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Administrators</h3>
              <p className="text-xs text-gray-500 mt-1">{((userStats.admins / (userStats.total || 1)) * 100).toFixed(0)}% of total users</p>
            </div>

            {/* Total Interviews Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl p-6 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <DocumentTextIcon className="h-6 w-6 text-green-400" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl font-bold text-white">{systemStats.totalInterviews}</span>
                )}
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Total Interviews</h3>
              <p className="text-xs text-gray-500 mt-1">Avg {(systemStats.totalInterviews / (userStats.total || 1)).toFixed(1)} per user</p>
            </div>

            {/* Average Score Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <TrophyIcon className="h-6 w-6 text-yellow-400" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className={`text-2xl font-bold ${getScoreColor(systemStats.avgOverallScore)}`}>
                    {systemStats.avgOverallScore}%
                  </span>
                )}
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Average Score</h3>
              <p className="text-xs text-gray-500 mt-1">Across all interviews</p>
            </div>
          </div>

          {/* Active Users Card - Removed Completion Rate and Total Time, kept only Active Users */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
            {/* Active Users (30 days) */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <FireIcon className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-gray-300">Active Users (30 days)</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{systemStats.activeUsers30d}</span>
                <span className="text-xs text-gray-500">active users</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {((systemStats.activeUsers30d / (userStats.total || 1)) * 100).toFixed(0)}% of total users
              </p>
              <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(systemStats.activeUsers30d / (userStats.total || 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Top Performers Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Most Popular Personality */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-300">Most Popular Interviewer</h3>
              </div>
              {topPerformer ? (
                <>
                  <p className="text-xl font-semibold text-white">{topPerformer[0]}</p>
                  <p className="text-sm text-gray-400 mt-1">{topPerformer[1]} interviews conducted</p>
                  <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(topPerformer[1] / (systemStats.totalInterviews || 1)) * 100}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>

            {/* Most Popular Job Role */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <BriefcaseIcon className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-semibold text-gray-300">Most Popular Job Role</h3>
              </div>
              {topRole ? (
                <>
                  <p className="text-xl font-semibold text-white">{topRole[0]}</p>
                  <p className="text-sm text-gray-400 mt-1">{topRole[1]} interviews conducted</p>
                  <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(topRole[1] / (systemStats.totalInterviews || 1)) * 100}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity Feed - Only last 5 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">Last 5</span>
            </div>
            <div className="space-y-3">
              {systemStats.recentActivity && systemStats.recentActivity.length > 0 ? (
                systemStats.recentActivity.slice(0, 5).map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 text-sm py-3 px-3 rounded-lg border-b border-white/5 hover:bg-white/5 transition-all duration-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-gray-300 flex-1">{activity.message}</span>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">{activity.time}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs text-gray-500 mt-1">Activities will appear here once users complete interviews</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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

export default AdminAnalytics;