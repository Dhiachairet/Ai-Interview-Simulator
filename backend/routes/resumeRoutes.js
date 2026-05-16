const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadResume,
  getResume,
  deleteResume
} = require('../controllers/resumeController');

router.post('/upload', protect, uploadResume);
router.get('/', protect, getResume);
router.delete('/', protect, deleteResume);

module.exports = router;