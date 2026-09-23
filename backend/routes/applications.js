const express = require('express');
const {
  getApplications,
  getApplication,
  createApplication,
  submitApplication,
  processApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applications');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getApplications)
  .post(authorize('employee'), createApplication);

router
  .route('/:id')
  .get(getApplication)
  .put(authorize('employee', 'officer'), updateApplication)
  .delete(deleteApplication);

router.put('/:id/submit', authorize('employee'), submitApplication);
router.put('/:id/process', authorize('officer'), processApplication);

module.exports = router;
