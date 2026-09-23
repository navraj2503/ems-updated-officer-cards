const express = require('express');
const {
  getNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/notices');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getNotices).post(protect, authorize('dept_admin', 'super_admin'), createNotice);
router
  .route('/:id')
  .get(getNotice)
  .put(protect, authorize('dept_admin', 'super_admin'), updateNotice)
  .delete(protect, authorize('dept_admin', 'super_admin'), deleteNotice);

module.exports = router;
