import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../context/DialogProvider';
import MobileNav from '../../components/MobileNav';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, ShieldCheckIcon, MagnifyingGlassIcon, PlusIcon,
  PencilSquareIcon, TrashIcon, ArrowRightOnRectangleIcon, ChartBarIcon,
  DocumentTextIcon, MicrophoneIcon, HomeIcon, BriefcaseIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { iconComponents, AVAILABLE_ICONS } from '../../constants/iconMap';

const AdminJobRoles = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, logout } = useAuth();
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconName: 'BriefcaseIcon',
    gradient: 'from-blue-500 to-cyan-500',
  });

  const navigationItems = [
    { name: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" />, path: '/admin' },
    { name: 'Users', icon: <UserGroupIcon className="h-5 w-5" />, path: '/admin/users' },
    { name: 'Interviews', icon: <DocumentTextIcon className="h-5 w-5" />, path: '/admin/interviews' },
    { name: 'Job Roles', icon: <BriefcaseIcon className="h-5 w-5" />, path: '/admin/job-roles', active: true },
    { name: 'Vapi Settings', icon: <MicrophoneIcon className="h-5 w-5" />, path: '/admin/vapi-settings' },
    { name: 'Profile', icon: <HomeIcon className="h-5 w-5" />, path: '/profile' },
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchJobRoles();
  }, [user]);

  const fetchJobRoles = async () => {
    try {
      setLoading(true);
const response = await api.get('/api/admin/job-roles');
      if (response.data.success) {
        setJobRoles(response.data.data);
      }
    } catch (err) {
      setError('Failed to load job roles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      iconName: 'BriefcaseIcon',
      gradient: 'from-blue-500 to-cyan-500',
    });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      iconName: role.iconName,
      gradient: role.gradient,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Name and description are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingRole) {
        await api.put(`/api/admin/job-roles/${editingRole._id}`, formData);
      } else {
await api.post('/api/admin/job-roles', formData);  // Same, no change
      }
      await fetchJobRoles();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete job role?', message: 'This will affect existing interviews.', confirmText: 'Delete', tone: 'danger' }))) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/job-roles/${id}`);
      await fetchJobRoles();
    } catch (err) {
      setError('Failed to delete job role');
    } finally {
      setDeletingId(null);
    }
  };

  const getIconComponent = (iconName, className = "h-6 w-6") => {
    const Icon = iconComponents[iconName];
    return Icon ? <Icon className={className} /> : <BriefcaseIcon className={className} />;
  };

  const filteredRoles = jobRoles.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading job roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white flex overflow-hidden">
      {/* Animated Background - same as other admin pages */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <MobileNav
        items={navigationItems}
        user={user}
        onLogout={handleLogout}
        headerIcon={<ShieldCheckIcon className="h-6 w-6 text-white" />}
        headerTitle="Admin Console"
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
                <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name || 'Admin'}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email || 'admin@example.com'}</p>
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
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300/70">Role Management</p>
              <h1 className="text-3xl md:text-4xl font-semibold mt-2">Job Roles</h1>
              <p className="text-gray-400 mt-2">Manage job roles displayed to users during interview setup</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Add Job Role
            </motion.button>
          </div>

          {/* Search */}
          <div className="mb-6 relative max-w-md">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job roles..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Job Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <motion.div
                key={role._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${role.gradient}`}>
                    {getIconComponent(role.iconName, "h-6 w-6 text-white")}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(role)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                      <PencilSquareIcon className="h-4 w-4 text-gray-300" />
                    </button>
                    <button onClick={() => handleDelete(role._id)} disabled={deletingId === role._id} className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition disabled:opacity-50">
                      <TrashIcon className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{role.name}</h3>
                <p className="text-sm text-gray-400">{role.description}</p>
                <div className="mt-3 text-xs text-gray-500">Icon: {role.iconName}</div>
              </motion.div>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-2xl">
              <BriefcaseIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No job roles found</p>
              <button onClick={openCreateModal} className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-white text-sm">
                Add your first job role
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal - Create/Edit */}
      {/* Modal - Create/Edit */}
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={() => setShowModal(false)}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative bg-[#0F1428] border border-white/20 rounded-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {editingRole ? 'Edit Job Role' : 'Create New Job Role'}
          </h2>
          <button 
            onClick={() => setShowModal(false)} 
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g., DevOps Engineer"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                placeholder="Brief description of the role"
              />
            </div>
          </div>

          {/* Icon Selection - Simple Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Icon
            </label>
            <div className="flex items-center gap-4">
              {/* Icon Preview */}
              <div className={`p-3 rounded-xl bg-gradient-to-r ${formData.gradient} shadow-lg`}>
                {getIconComponent(formData.iconName, "h-8 w-8 text-white")}
              </div>
              
              {/* Dropdown */}
              <select
                value={formData.iconName}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {AVAILABLE_ICONS.map((icon) => (
                  <option key={icon.name} value={icon.name} className="bg-[#0F1428]">
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gradient Selection - Color Swatches */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Color Theme
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'from-blue-500 to-cyan-500', label: 'Blue', colors: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
                { value: 'from-purple-500 to-pink-500', label: 'Purple', colors: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                { value: 'from-green-500 to-emerald-500', label: 'Green', colors: 'bg-gradient-to-r from-green-500 to-emerald-500' },
                { value: 'from-orange-500 to-amber-500', label: 'Orange', colors: 'bg-gradient-to-r from-orange-500 to-amber-500' },
                { value: 'from-red-500 to-rose-500', label: 'Red', colors: 'bg-gradient-to-r from-red-500 to-rose-500' },
                { value: 'from-indigo-500 to-purple-500', label: 'Indigo', colors: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
                { value: 'from-pink-500 to-rose-500', label: 'Pink', colors: 'bg-gradient-to-r from-pink-500 to-rose-500' },
                { value: 'from-teal-500 to-cyan-500', label: 'Teal', colors: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
                { value: 'from-yellow-500 to-orange-500', label: 'Yellow', colors: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
                { value: 'from-sky-500 to-blue-500', label: 'Sky', colors: 'bg-gradient-to-r from-sky-500 to-blue-500' }
              ].map((gradient) => (
                <button
                  key={gradient.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gradient: gradient.value })}
                  className={`group relative p-1 rounded-lg transition-all duration-200 ${
                    formData.gradient === gradient.value
                      ? 'ring-2 ring-white scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`h-10 w-full rounded-lg ${gradient.colors} shadow-md`} />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {gradient.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Live Preview</p>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${formData.gradient} shadow-lg`}>
                {getIconComponent(formData.iconName, "h-8 w-8 text-white")}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {formData.name || "Role Name"}
                </h3>
                <p className="text-sm text-gray-400">
                  {formData.description || "Description will appear here"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-[#0F1428]">
          <button
            onClick={() => setShowModal(false)}
            className="px-5 py-2.5 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || !formData.description.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              editingRole ? 'Update Role' : 'Create Role'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default AdminJobRoles;