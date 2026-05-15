const JobRole = require('../models/JobRole');

// @desc    Get all active job roles (for users)
// @route   GET /api/job-roles
// @access  Public
const getActiveJobRoles = async (req, res) => {
  try {
    const roles = await JobRole.find({ isActive: true }).sort('order');
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all job roles (admin only)
// @route   GET /api/admin/job-roles
// @access  Private/Admin
const getAllJobRoles = async (req, res) => {
  try {
    const roles = await JobRole.find().sort('order');
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create job role
// @route   POST /api/admin/job-roles
// @access  Private/Admin
const createJobRole = async (req, res) => {
  try {
    console.log('📝 Create job role request received');
    const { name, description, iconName, gradient } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and description are required' 
      });
    }
    
    // Check for existing role
    const existingRole = await JobRole.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job role already exists' 
      });
    }
    
    // ✅ AUTO-CALCULATE ORDER: Get the highest order number and add 1
    const lastRole = await JobRole.findOne().sort({ order: -1 });
    const autoOrder = lastRole ? lastRole.order + 1 : 0;
    
    // Create new role with auto order
    const role = await JobRole.create({
      name,
      description,
      iconName: iconName || 'BriefcaseIcon',
      gradient: gradient || 'from-blue-500 to-cyan-500',
      order: autoOrder  // Auto-calculated
    });
    
    console.log(`✅ Job role created with order: ${autoOrder}`);
    res.status(201).json({ success: true, data: role });
    
  } catch (error) {
    console.error('❌ Error creating job role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update job role
// @route   PUT /api/admin/job-roles/:id
// @access  Private/Admin
const updateJobRole = async (req, res) => {
  try {
    const { name, description, iconName, gradient, isActive, order } = req.body;
    
    const role = await JobRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Job role not found' });
    }
    
    if (name) role.name = name;
    if (description) role.description = description;
    if (iconName) role.iconName = iconName;
    if (gradient) role.gradient = gradient;
    if (typeof isActive !== 'undefined') role.isActive = isActive;
    if (typeof order !== 'undefined') role.order = order;
    
    await role.save();
    
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete job role
// @route   DELETE /api/admin/job-roles/:id
// @access  Private/Admin
const deleteJobRole = async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Job role not found' });
    }
    
    await role.deleteOne();
    res.status(200).json({ success: true, message: 'Job role deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getActiveJobRoles,
  getAllJobRoles,
  createJobRole,
  updateJobRole,
  deleteJobRole
};