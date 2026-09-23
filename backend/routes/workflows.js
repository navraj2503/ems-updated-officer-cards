const express = require('express');
const {
  getWorkflow,
  upsertWorkflow,
} = require('../controllers/workflows');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/:deptId', getWorkflow);
router.post('/', authorize('dept_admin', 'super_admin'), upsertWorkflow);

module.exports = router;
