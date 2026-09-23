// Importing the custom ErrorResponse class
const ErrorResponse = require('../utils/errorResponse');

// Global error handling middleware for formatting backend errors
const errorHandler = (err, req, res, next) => {
  // Creating a copy of the error object
  let error = { ...err };

  // Ensuring the error message is preserved
  error.message = err.message;

  // Log to console for dev
  console.log(err);

  // Handling Mongoose invalid ObjectID errors (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Handling Mongoose duplicate key errors (code 11000)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Handling Mongoose data validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Sending the formatted JSON error response to the client
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Exporting the error handler middleware
module.exports = errorHandler;
