import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  HomeIcon,
  Cog6ToothIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminInterviews = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interviewQuery, setInterviewQuery] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalInterviews: 0,
    avgOverallScore: 0,
    totalDuration: 0
  });

  const navigationItems = [
    { name: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" />, path: '/admin' },
    { name: 'Users', icon: <UserGroupIcon className="h-5 w-5" />, path: '/admin/users' },
    { name: 'Interviews', icon: <DocumentTextIcon className="h-5 w-5" />, path: '/admin/interviews', active: true },
    { name: 'Vapi Settings', icon: <MicrophoneIcon className="h-5 w-5" />, path: '/admin/vapi-settings' },
    { name: 'Profile', icon: <HomeIcon className="h-5 w-5" />, path: '/profile' },
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchInterviews();
    fetchSystemStats();
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInterviews();
    }, 300);
    return () => clearTimeout(timeout);
  }, [interviewQuery, interviewStatus]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await adminService.listInterviews({ q: interviewQuery, status: interviewStatus });
      if (response.success) {
        setInterviews(response.data || []);
        setError(null);
      } else {
        setError('Failed to load interviews');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await adminService.getSystemStats();
      if (response.success) {
        setSystemStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Delete this interview? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(id);
      await adminService.deleteInterview(id);
      fetchInterviews();
      fetchSystemStats();
    } catch (err) {
      setError(err.message || 'Failed to delete interview');
    } finally {
      setDeletingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white flex overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

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

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300/70">Interview Management</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Interviews</h1>
            <p className="text-gray-400 mt-2">Review and manage all interview sessions across the platform.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Interviews</p>
                  <p className="text-3xl font-semibold mt-2">{systemStats.totalInterviews}</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Average Score</p>
                  <p className="text-3xl font-semibold text-yellow-400 mt-2">{systemStats.avgOverallScore}%</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Duration</p>
                  <p className="text-3xl font-semibold text-blue-400 mt-2">{Math.floor(systemStats.totalDuration / 60)} min</p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:max-w-sm">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={interviewQuery}
                  onChange={(event) => setInterviewQuery(event.target.value)}
                  placeholder="Search by user, role, or status"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={interviewStatus}
                  onChange={(event) => setInterviewStatus(event.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="evaluating">Evaluating</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-10">Loading interviews...</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Personality</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Created</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((item) => (
                      <tr key={item._id} className="border-b border-white/5">
                        <td className="py-4">
                          <p className="text-white font-medium">{item.user?.name || 'Unknown'}</p>
                          <p className="text-gray-400 text-xs">{item.user?.email || 'No email'}</p>
                        </td>
                        <td className="py-4 text-gray-300 capitalize">{item.jobRole}</td>
                        <td className="py-4 text-gray-300 capitalize">{item.personality}</td>
                        <td className="py-4">
                          <span className={`font-semibold ${getScoreColor(item.overallScore || 0)}`}>
                            {item.overallScore || 0}%
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-200'
                              : item.status === 'evaluating'
                              ? 'bg-purple-500/20 text-purple-200'
                              : 'bg-yellow-500/20 text-yellow-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 text-gray-300">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteInterview(item._id)}
                            disabled={deletingId === item._id}
                            title="Delete interview"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-red-300 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {interviews.length === 0 && (
                  <div className="text-center text-gray-400 py-10">No interviews found.</div>
                )}
              </div>
            )}
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

export default AdminInterviews;