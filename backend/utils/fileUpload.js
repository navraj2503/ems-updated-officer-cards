// Importing multer for handling file uploads
const multer = require('multer');
// Importing path for file extension processing
const path = require('path');
// Importing custom ErrorResponse for error handling
const ErrorResponse = require('./errorResponse');

// Configuring the disk storage engine for multer
const storage = multer.diskStorage({
  // Setting the destination directory for uploaded files
  destination: function (req, file, cb) {
    // Ensure the path is absolute and points to backend/uploads
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  // Defining the file naming convention (field-timestamp.extension)
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Helper function to validate file extensions and mime types
function checkFileType(file, cb) {
  // Allowed file extensions and mime types
  const filetypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|zip/;
  // Checking the file extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Checking the file mime type
  const mimetype = filetypes.test(file.mimetype);

  // If both are valid, allow the upload
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    // Return an error if the file type is not allowed
    cb(new ErrorResponse('Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, WEBP, and ZIP files are allowed.', 400));
  }
}

// Initializing the multer upload middleware
const upload = multer({
  // Using the configured disk storage
  storage: storage,
  // Setting a file size limit of 10MB
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  // Using the fileFilter function to validate file types
  fileFilter: function (_req, file, cb) {
    checkFileType(file, cb);
  },
});

// Exporting the upload middleware
module.exports = upload;
