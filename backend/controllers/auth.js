// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the User model to interact with user data in the database
const User = require('../models/User');

// Helper function to generate a JWT token, structure the user data, and send a response
// This avoids repeating the same code in registration and login functions.
const sendTokenResponse = (user, statusCode, res) => {
  // Call the custom method on the user model to create a signed JSON Web Token (JWT)
  const token = user.getSignedJwtToken();

  // Send a JSON response with the status code (e.g., 200 for OK, 201 for Created)
  res.status(statusCode).json({
    success: true,
    token, // Include the token for the frontend to store and use for future requests
    // Send back a subset of user details that are safe to show in the UI
    user: {
      id: user.id || user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      deptId: user.deptId,
      officerRole: user.officerRole,
      profileImage: user.profileImage
    }
  });
};

// @desc    Register a new user in the system
// @route   POST /api/auth/register
// @access  Public (Anyone can hit this endpoint, but usually managed by admins in EMS)
exports.register = asyncHandler(async (req, res, next) => {
  // Destructure the registration data from the request body
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    deptId,
    officerRole
  } = req.body;

  // Create the user document in the database
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    deptId,
    officerRole
  });

  // Generate a token and send the user details back to the client
  sendTokenResponse(user, 201, res);
});

// @desc    Authenticate an existing user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  // Get email, password, and captcha info from the login form data
  const { email, password, captchaValue, captchaToken } = req.body;

  // Validation: Check if both email and password were provided
  if (!email || !password) {
    return next(
      new ErrorResponse('Please provide an email and password', 400)
    );
  }

  // Captcha Validation
  if (!captchaValue || !captchaToken) {
    return next(new ErrorResponse('Please complete the captcha', 400));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(captchaToken, process.env.JWT_SECRET);
    if (decoded.text.toUpperCase() !== captchaValue.toUpperCase()) {
      return next(new ErrorResponse('Invalid captcha code', 400));
    }
  } catch (err) {
    return next(new ErrorResponse('Captcha expired or invalid. Please refresh.', 400));
  }

  // Find the user by their email. 
  // We explicitly use '.select('+password')' because the User model hides the password by default for security.
  const user = await User.findOne({ email }).select('+password');

  // If no user exists with that email, return an authentication error
  if (!user) {
    return next(
      new ErrorResponse('Invalid credentials', 401)
    );
  }

  // Compare the provided password with the hashed password stored in the database
  const isMatch = await user.matchPassword(password);

  // If the password doesn't match, return an authentication error
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // If everything is correct, send the token and user details back
  sendTokenResponse(user, 200, res);
});

// @desc    Retrieve the current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (Requires a valid JWT token)
exports.getMe = asyncHandler(async (req, res, next) => {
  // Find the user by the ID extracted from the JWT by the 'protect' middleware
  // We use '.populate('deptId')' to get full department details instead of just the ID
  const user = await User.findById(req.user.id).populate('deptId');

  // Return the user data
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Log a user out (Client-side usually clears the token)
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // In a JWT setup, the server just sends a success message.
  // The frontend is responsible for deleting the token from its storage (localStorage/Cookies).
  res.status(200).json({
    success: true,
    data: {},
  });
});
