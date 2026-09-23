// Importing jsonwebtoken for token verification
const jwt = require('jsonwebtoken');
// Importing asyncHandler for catching async errors
const asyncHandler = require('./async');
// Importing custom ErrorResponse for structured errors
const ErrorResponse = require('../utils/errorResponse');
// Importing User model to fetch user data
const User = require('../models/User');

// Middleware to protect routes from unauthorized access
exports.protect = asyncHandler(async (req, res, next) => {
  // Initializing variable for the token
  let token;

  // Checking for Bearer token in the authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Finding the user in the database based on the token's payload
    req.user = await User.findById(decoded.id);

    // Checking if the user exists
    if (!req.user) {
      return next(new ErrorResponse('User not found with this token', 401));
    }

    // Continuing to the next middleware or controller
    next();
  } catch (err) {
    // Handling invalid or expired tokens
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Middleware to grant access to specific user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Checking if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    // Continuing if the user has the required permissions
    next();
  };
};
