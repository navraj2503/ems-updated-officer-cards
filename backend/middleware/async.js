// Middleware that wraps asynchronous functions to catch and pass errors to the global error handler
const asyncHandler = (fn) => (req, res, next) =>
  // Resolving the function and catching any errors
  Promise.resolve(fn(req, res, next)).catch(next);

// Exporting the asyncHandler middleware
module.exports = asyncHandler;
