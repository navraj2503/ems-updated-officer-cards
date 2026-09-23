const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getDepartments).post(protect, authorize('super_admin'), createDepartment);
router
  .route('/:id')
  .get(getDepartment)
  .put(protect, authorize('super_admin'), updateDepartment)
  .delete(protect, authorize('super_admin'), deleteDepartment);

module.exports = router;
