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

// ✅ PUBLIC ROUTE - No authentication (for /api/job-roles)
router.get('/', getActiveJobRoles);

// ✅ ADMIN ROUTES - Require authentication (for /api/admin/job-roles)
router.get('/all', protect, adminOnly, getAllJobRoles);
router.post('/', protect, adminOnly, createJobRole);
router.put('/:id', protect, adminOnly, updateJobRole);
router.delete('/:id', protect, adminOnly, deleteJobRole);

module.exports = router;