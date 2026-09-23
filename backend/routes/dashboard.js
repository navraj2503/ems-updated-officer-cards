const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getDashboardStats);

module.exports = router;
