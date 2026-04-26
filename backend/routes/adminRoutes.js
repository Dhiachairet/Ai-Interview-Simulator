const express = require('express');
const router = express.Router();
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  listInterviews,
  deleteInterview
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);

router.get('/interviews', listInterviews);
router.delete('/interviews/:id', deleteInterview);

module.exports = router;
