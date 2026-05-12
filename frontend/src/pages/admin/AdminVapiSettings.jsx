import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MicrophoneIcon, 
  Cog6ToothIcon, 
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  HomeIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  ComputerDesktopIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Available voices from Vapi (Native + Legacy)
const AVAILABLE_VOICES = [
  { id: 'elliot', name: 'Elliot', gender: 'Male', type: 'Native' },
  { id: 'savannah', name: 'Savannah', gender: 'Female', type: 'Native' },
  { id: 'rohan', name: 'Rohan', gender: 'Male', type: 'Native' },
  { id: 'emma', name: 'Emma', gender: 'Female', type: 'Native' },
  { id: 'clara', name: 'Clara', gender: 'Female', type: 'Native' },
  { id: 'nico', name: 'Nico', gender: 'Male', type: 'Native' },
  { id: 'kai', name: 'Kai', gender: 'Male', type: 'Native' },
  { id: 'sagar', name: 'Sagar', gender: 'Male', type: 'Native' },
  { id: 'godfrey', name: 'Godfrey', gender: 'Male', type: 'Native' },
  { id: 'neil', name: 'Neil', gender: 'Male', type: 'Native' },
  { id: 'leo', name: 'Leo', gender: 'Male', type: 'Legacy' },
  { id: 'zoe', name: 'Zoe', gender: 'Female', type: 'Legacy' },
  { id: 'mia', name: 'Mia', gender: 'Female', type: 'Legacy' },
  { id: 'jess', name: 'Jess', gender: 'Female', type: 'Legacy' },
  { id: 'zac', name: 'Zac', gender: 'Male', type: 'Legacy' },
  { id: 'dan', name: 'Dan', gender: 'Male', type: 'Legacy' },
  { id: 'leah', name: 'Leah', gender: 'Female', type: 'Legacy' },
  { id: 'tara', name: 'Tara', gender: 'Female', type: 'Legacy' }
];

const AdminVapiSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState({
    name: '',
    firstMessage: '',
    systemPrompt: '',
    voice: 'emma'
  });

 // Replace the navigationItems in AdminVapiSettings.jsx with this:

const getNavigationItems = () => {
  // Admin users see only admin options
  if (user?.role === 'admin') {
    return [
      { name: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" />, path: '/admin', active: false },
      { name: 'Users', icon: <UserGroupIcon className="h-5 w-5" />, path: '/admin', active: false },
      { name: 'Interviews', icon: <ClipboardDocumentListIcon className="h-5 w-5" />, path: '/admin', active: false },
      { name: 'Vapi Settings', icon: <MicrophoneIcon className="h-5 w-5" />, path: '/admin/vapi-settings', active: true },
      { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile', active: false },
    ];
  }
  
  // Regular users see regular options
  return [
    { name: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, path: '/', active: false },
    { name: 'New Interview', icon: <PlayIcon className="h-5 w-5" />, path: '/interview-config', active: false },
    { name: 'History', icon: <ClockIcon className="h-5 w-5" />, path: '/history', active: false },
    { name: 'Reports', icon: <ChartBarIcon className="h-5 w-5" />, path: '/reports', active: false },
    { name: 'Profile', icon: <UserCircleIcon className="h-5 w-5" />, path: '/profile', active: false },
  ];
};

const navigationItems = getNavigationItems();
  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/vapi/assistants');
      if (response.data.success) {
        setAssistants(response.data.data);
        if (response.data.data.length > 0 && !selectedAssistant) {
          selectAssistant(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
      setError('Failed to load assistants from Vapi');
    } finally {
      setLoading(false);
    }
  };

  const selectAssistant = (assistant) => {
    setSelectedAssistant(assistant);
    
    let systemPrompt = '';
    if (assistant.model?.messages) {
      const systemMessage = assistant.model.messages.find(m => m.role === 'system');
      if (systemMessage?.content) {
        systemPrompt = systemMessage.content;
      }
    }
    
    setConfig({
      name: assistant.name || '',
      firstMessage: assistant.firstMessage || '',
      systemPrompt: systemPrompt,
      voice: assistant.voice?.voiceId || 'emma'
    });
  };

  const handleSave = async () => {
    if (!selectedAssistant) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put(`/api/admin/vapi/assistants/${selectedAssistant.id}/prompt`, {
        name: config.name,
        firstMessage: config.firstMessage,
        systemPrompt: config.systemPrompt,
        voice: config.voice
      });
      
      if (response.data.success) {
        setSuccess('Assistant configuration updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchAssistants();
      }
    } catch (error) {
      console.error('Error saving:', error);
      setError(error.response?.data?.error || 'Failed to save configuration');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading assistants...</p>
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
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-3"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to Admin Dashboard</span>
            </button>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Vapi Assistant Manager
            </h1>
            <p className="text-gray-400 text-sm">Configure your AI interviewers</p>
          </motion.div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-2 text-sm"
              >
                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                <p className="text-green-400">{success}</p>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-sm"
              >
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Assistant List - Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MicrophoneIcon className="h-4 w-4 text-blue-400" />
                  Assistants ({assistants.length})
                </h2>
                <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => selectAssistant(assistant)}
                      className={`w-full text-left p-2 rounded-lg transition-all text-sm ${
                        selectedAssistant?.id === assistant.id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <p className="font-medium truncate">{assistant.name}</p>
                      <p className="text-xs text-gray-500 truncate">{assistant.id.slice(0, 8)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Editor - Right Content */}
            {selectedAssistant ? (
              <div className="lg:col-span-3 space-y-4">
                {/* Basic Info Row - Name + Voice side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Assistant Name
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Voice
                    </label>
                    <select
                      value={config.voice}
                      onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <optgroup label="Native Voices">
                        {AVAILABLE_VOICES.filter(v => v.type === 'Native').map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} - {voice.gender}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Legacy Voices">
                        {AVAILABLE_VOICES.filter(v => v.type === 'Legacy').map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} - {voice.gender}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Model Info - Compact */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ComputerDesktopIcon className="h-4 w-4 text-yellow-400" />
                    <h2 className="text-sm font-semibold">Model: GPT-4o Mini Cluster</h2>
                    <span className="text-xs text-gray-500">(Fixed)</span>
                  </div>
                  <p className="text-xs text-gray-500">Provider: OpenAI • Fast, efficient, optimized for interviews</p>
                </div>

                {/* First Message */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-400" />
                    <h2 className="text-sm font-semibold">First Message</h2>
                  </div>
                  <textarea
                    value={config.firstMessage}
                    onChange={(e) => setConfig({ ...config, firstMessage: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Enter the first message..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{{jobRole}}'} and {'{{difficulty}}'} as variables</p>
                </div>

                {/* System Prompt */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CodeBracketIcon className="h-4 w-4 text-purple-400" />
                    <h2 className="text-sm font-semibold">System Prompt</h2>
                  </div>
                  <textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono text-xs"
                    placeholder="Enter the system prompt..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Include behavior rules directly in the prompt</p>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            ) : (
              <div className="lg:col-span-3 flex items-center justify-center">
                <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                  <MicrophoneIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-1">No Assistant Selected</h3>
                  <p className="text-gray-400 text-sm">Select an assistant from the list to configure</p>
                </div>
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

export default AdminVapiSettings;