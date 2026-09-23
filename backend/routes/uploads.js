const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('../utils/fileUpload');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      // Return a relative path that works with the static /uploads route
      path: `uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
    },
  });
});

// @desc    Download a file
// @route   GET /api/uploads/download/:filename
// @access  Private
router.get('/download/:filename', protect, (req, res, next) => {
  const filename = req.params.filename;
  // Use the absolute path for the file
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return next(new ErrorResponse('File not found', 404));
  }

  // Use the original filename if provided in query, otherwise use the stored filename
  const originalName = req.query.name || filename;

  // Trigger download
  res.download(filePath, originalName, (err) => {
    if (err) {
      if (!res.headersSent) {
        return next(new ErrorResponse('Error downloading file', 500));
      }
    }
  });
});

module.exports = router;
