// Importing express for routing
const express = require('express');
// Importing controller functions for authentication
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/auth');
// Importing controller function for captcha generation
const { getCaptcha } = require('../controllers/captcha');

// Initializing the express router
const router = express.Router();

// Importing protection middleware
const { protect } = require('../middleware/auth');

// Route to get a new captcha
router.get('/captcha', getCaptcha);
// Route for user registration
router.post('/register', register);
// Route for user login
router.post('/login', login);
// Route for user logout
router.get('/logout', logout);
// Route to get current logged-in user profile
router.get('/me', protect, getMe);

// Exporting the auth router
module.exports = router;
