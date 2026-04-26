const User = require('../models/User');
const Interview = require('../models/Interview');

const buildUserQuery = (query, role) => {
  const filter = {};

  if (query) {
    const safeQuery = query.trim();
    if (safeQuery.length > 0) {
      filter.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { email: { $regex: safeQuery, $options: 'i' } }
      ];
    }
  }

  if (role && role !== 'all') {
    filter.role = role;
  }

  return filter;
};

const ensureNotLastAdmin = async (targetUserId) => {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount <= 1) {
    const target = await User.findById(targetUserId).select('role');
    if (target && target.role === 'admin') {
      return false;
    }
  }

  return true;
};

// @desc    List users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const listUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    const filter = buildUserQuery(q, role);

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user by id (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      authProvider: 'local'
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email is already in use' });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (role) {
      if (req.user.id === user.id && role !== 'admin') {
        return res.status(400).json({ success: false, error: 'You cannot remove your own admin role' });
      }

      const canChange = await ensureNotLastAdmin(user.id);
      if (!canChange && role !== 'admin') {
        return res.status(400).json({ success: false, error: 'At least one admin is required' });
      }

      user.role = role;
    }

    if (password) {
      user.password = password;
      user.authProvider = 'local';
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const canDelete = await ensureNotLastAdmin(req.params.id);
    if (!canDelete) {
      return res.status(400).json({ success: false, error: 'At least one admin is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Suspend user (admin only)
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ success: false, error: 'You cannot suspend your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'suspended';
    user.tokenInvalidBefore = new Date();
    await user.save();

    res.status(200).json({ success: true, data: { id: user._id, status: user.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Activate user (admin only)
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'active';
    await user.save();

    res.status(200).json({ success: true, data: { id: user._id, status: user.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    List interviews (admin only)
// @route   GET /api/admin/interviews
// @access  Private/Admin
const listInterviews = async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q && q.trim().length > 0) {
      const safeQuery = q.trim();
      const userMatches = await User.find({
        $or: [
          { name: { $regex: safeQuery, $options: 'i' } },
          { email: { $regex: safeQuery, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = userMatches.map((item) => item._id);
      filter.$or = [
        { jobRole: { $regex: safeQuery, $options: 'i' } },
        { personality: { $regex: safeQuery, $options: 'i' } },
        { status: { $regex: safeQuery, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const interviews = await Interview.find(filter)
      .populate('user', 'name email role')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete interview (admin only)
// @route   DELETE /api/admin/interviews/:id
// @access  Private/Admin
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    await interview.deleteOne();
    res.status(200).json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  listInterviews,
  deleteInterview
};
