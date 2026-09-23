const express = require('express');
const {
  createResetRequest,
  getResetRequests,
  updateResetRequest
} = require('../controllers/passwordResets');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public route to submit a request
router.post('/', createResetRequest);

// Protected routes for admins
router.get('/', protect, authorize('super_admin', 'dept_admin'), getResetRequests);
router.put('/:id', protect, authorize('super_admin', 'dept_admin'), updateResetRequest);

module.exports = router;
