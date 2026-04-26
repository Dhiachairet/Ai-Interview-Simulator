import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user'
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formState, setFormState] = useState(emptyForm);
  const [activeUserId, setActiveUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeView, setActiveView] = useState('users');
  const [interviews, setInterviews] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewQuery, setInterviewQuery] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('all');

  const navigationItems = [
    { id: 'users', name: 'Users', icon: <UserGroupIcon className="h-5 w-5" /> },
    { id: 'interviews', name: 'Interviews', icon: <ClipboardDocumentListIcon className="h-5 w-5" /> }
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeView === 'users') {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, roleFilter, activeView]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeView === 'interviews') {
        fetchInterviews();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [interviewQuery, interviewStatus, activeView]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.listUsers({ q: search, role: roleFilter });
      if (response.success) {
        setUsers(response.data || []);
        setError(null);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      setInterviewLoading(true);
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
      setInterviewLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((item) => item.role === 'admin').length;
    const googleUsers = users.filter((item) => item.authProvider === 'google').length;
    const localUsers = total - googleUsers;

    return { total, admins, googleUsers, localUsers };
  }, [users]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openCreate = () => {
    setFormState(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (selectedUser) => {
    setActiveUserId(selectedUser._id);
    setFormState({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      role: selectedUser.role || 'user',
      password: ''
    });
    setEditOpen(true);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditOpen(false);
    setActiveUserId(null);
    setFormState(emptyForm);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (createOpen) {
        const response = await adminService.createUser(formState);
        if (!response.success) {
          throw new Error(response.error || 'Failed to create user');
        }
      } else if (editOpen && activeUserId) {
        const payload = { ...formState };
        if (!payload.password) {
          delete payload.password;
        }
        const response = await adminService.updateUser(activeUserId, payload);
        if (!response.success) {
          throw new Error(response.error || 'Failed to update user');
        }
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await adminService.deleteUser(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (targetUser) => {
    try {
      if (targetUser.status === 'suspended') {
        await adminService.activateUser(targetUser._id);
      } else {
        await adminService.suspendUser(targetUser._id);
      }
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Delete this interview? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await adminService.deleteInterview(id);
      fetchInterviews();
    } catch (err) {
      setError(err.message || 'Failed to delete interview');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

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
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeView === item.id
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="w-full mt-2 flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              <span>Back to App</span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300/70">Admin Control</p>
              <h1 className="text-3xl md:text-4xl font-semibold mt-2">
                {activeView === 'users' ? 'User Management' : 'Interview Oversight'}
              </h1>
              <p className="text-gray-400 mt-2">
                {activeView === 'users'
                  ? 'Create, update, and manage access for your users.'
                  : 'Review and clean up interviews across the platform.'}
              </p>
            </div>
            {activeView === 'users' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openCreate}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25"
              >
                <PlusIcon className="h-5 w-5" />
                <span>New User</span>
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-semibold mt-2">{stats.total}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Admins</p>
                  <p className="text-3xl font-semibold mt-2">{stats.admins}</p>
                </div>
                <ShieldCheckIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Google Auth</p>
                  <p className="text-3xl font-semibold mt-2">{stats.googleUsers}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-pink-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Local Auth</p>
                  <p className="text-3xl font-semibold mt-2">{stats.localUsers}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          {activeView === 'users' ? (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:max-w-sm">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Auth</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item._id} className="border-b border-white/5">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500/70 to-purple-500/70 flex items-center justify-center">
                            <span className="text-sm font-semibold">{item.name?.charAt(0) || 'U'}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-gray-400 text-xs">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-200'
                            : 'bg-blue-500/20 text-blue-200'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'suspended'
                            ? 'bg-red-500/20 text-red-200'
                            : 'bg-emerald-500/20 text-emerald-200'
                        }`}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300 capitalize">{item.authProvider || 'local'}</td>
                      <td className="py-4 text-gray-300">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit user"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(item)}
                            title={item.status === 'suspended' ? 'Activate user' : 'Suspend user'}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200"
                          >
                            {item.status === 'suspended'
                              ? <LockOpenIcon className="h-4 w-4" />
                              : <LockClosedIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            title="Delete user"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-red-300 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center text-gray-400 py-10">No users found.</div>
              )}
            </div>
          </div>
          ) : (
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
                  </select>
                </div>
              </div>

              {interviewLoading ? (
                <div className="text-center text-gray-400 py-10">Loading interviews...</div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Personality</th>
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-200'
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
          )}
        </div>
      </div>

      <AnimatePresence>
        {(createOpen || editOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg bg-[#10162A] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {createOpen ? 'Create User' : 'Edit User'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <input
                      value={formState.name}
                      onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                      className="w-full mt-2 px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      value={formState.email}
                      onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                      className="w-full mt-2 px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">
                      {createOpen ? 'Password' : 'Password (optional)'}
                    </label>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={(event) => setFormState({ ...formState, password: event.target.value })}
                      className="w-full mt-2 px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Role</label>
                    <select
                      value={formState.role}
                      onChange={(event) => setFormState({ ...formState, role: event.target.value })}
                      className="w-full mt-2 px-4 py-2 rounded-xl bg-[#0F1428] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : createOpen ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
