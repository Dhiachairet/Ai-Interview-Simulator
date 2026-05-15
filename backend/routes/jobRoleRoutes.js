const express = require('express');
const router = express.Router();
const {
  getActiveJobRoles,
  getAllJobRoles,
  createJobRole,
  updateJobRole,
  deleteJobRole
} = require('../controllers/jobRoleController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route for users (this will be at /api/job-roles if you want public access)
// For now, keep all under admin
router.get('/', protect, adminOnly, getAllJobRoles);
router.post('/', protect, adminOnly, createJobRole);
router.put('/:id', protect, adminOnly, updateJobRole);
router.delete('/:id', protect, adminOnly, deleteJobRole);

module.exports = router;