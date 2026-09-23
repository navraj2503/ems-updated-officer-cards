// Custom class to handle error responses with status codes
class ErrorResponse extends Error {
  // Initializing the error with a message and a status code
  constructor(message, statusCode) {
    // Calling the parent Error class constructor
    super(message);
    // Setting the custom status code (e.g., 404, 400)
    this.statusCode = statusCode;
  }
}

// Exporting the custom error class
module.exports = ErrorResponse;
