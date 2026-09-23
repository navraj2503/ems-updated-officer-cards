const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notice = require('../models/Notice');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Public
exports.getNotices = asyncHandler(async (req, res, next) => {
  const notices = await Notice.find().sort('-date').populate('author', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: notices.length,
    data: notices,
  });
});

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Public
exports.getNotice = asyncHandler(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id).populate('author', 'firstName lastName');

  if (!notice) {
    return next(new ErrorResponse(`Notice not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: notice,
  });
});

// @desc    Create notice
// @route   POST /api/notices
// @access  Private/Admin
exports.createNotice = asyncHandler(async (req, res, next) => {
  req.body.author = req.user.id;
  const notice = await Notice.create(req.body);

  res.status(201).json({
    success: true,
    data: notice,
  });
});

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private/Admin
exports.updateNotice = asyncHandler(async (req, res, next) => {
  let notice = await Notice.findById(req.params.id);

  if (!notice) {
    return next(new ErrorResponse(`Notice not found with id of ${req.params.id}`, 404));
  }

  notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: notice,
  });
});

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
exports.deleteNotice = asyncHandler(async (req, res, next) => {
  await Notice.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
