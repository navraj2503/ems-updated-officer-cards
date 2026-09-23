// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the PasswordResetRequest model
const PasswordResetRequest = require('../models/PasswordResetRequest');
// Import the User model to perform the actual password reset
const User = require('../models/User');
// Import the Notification model to alert users
const Notification = require('../models/Notification');
// Import the ActivityLog model to record admin actions
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a new password reset request
// @route   POST /api/password-resets
// @access  Public
exports.createResetRequest = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  // 1. Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('No account found with that email address', 404));
  }

  // 2. Check if a pending request already exists for this user
  const existingRequest = await PasswordResetRequest.findOne({ 
    employeeId: user._id, 
    status: 'pending' 
  });

  if (existingRequest) {
    return next(new ErrorResponse('You already have a pending password reset request', 400));
  }

  // 3. Create the request
  const resetRequest = await PasswordResetRequest.create({
    employeeId: user._id,
    employeeName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    deptId: user.deptId,
    status: 'pending'
  });

  // 4. Notify the department administrator
  // Find the dept_admin for this department
  const admin = await User.findOne({ deptId: user.deptId, role: 'dept_admin' });
  if (admin) {
    await Notification.create({
      userId: admin._id,
      message: `New password reset request received from ${user.firstName} ${user.lastName}`,
      type: 'password_reset',
      referenceId: resetRequest._id
    });
  }

  res.status(201).json({
    success: true,
    data: resetRequest
  });
});

// @desc    Get all password reset requests (filtered by admin's department)
// @route   GET /api/password-resets
// @access  Private/Admin
exports.getResetRequests = asyncHandler(async (req, res, next) => {
  let query;

  // Super admins see everything, Dept admins only see their department
  if (req.user.role === 'super_admin') {
    query = PasswordResetRequest.find();
  } else if (req.user.role === 'dept_admin') {
    query = PasswordResetRequest.find({ deptId: req.user.deptId });
  } else {
    return next(new ErrorResponse('Not authorized to access reset requests', 403));
  }

  const requests = await query.sort('-createdAt');

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Update a password reset request (Approve/Reject/Complete)
// @route   PUT /api/password-resets/:id
// @access  Private/Admin
exports.updateResetRequest = asyncHandler(async (req, res, next) => {
  const { status, remarks, newPassword } = req.body;
  
  let resetRequest = await PasswordResetRequest.findById(req.params.id);

  if (!resetRequest) {
    return next(new ErrorResponse('Request not found', 404));
  }

  // Update request fields
  resetRequest.status = status;
  resetRequest.remarks = remarks;
  resetRequest.reviewedBy = req.user.id;
  resetRequest.reviewedAt = Date.now();

  // If status is 'completed' and a new password is provided, reset the user's password
  if (status === 'completed' && newPassword) {
    const user = await User.findById(resetRequest.employeeId).select('+password');
    if (user) {
      user.password = newPassword;
      await user.save();

      // Create activity log
      await ActivityLog.create({
        userId: req.user.id,
        action: 'RESET_USER_PASSWORD',
        details: `Reset password for user: ${user.firstName} ${user.lastName}`,
      });

      // Notify the employee
      await Notification.create({
        userId: user._id,
        message: `Your password has been reset by the administrator. Remarks: ${remarks || 'None'}`,
        type: 'password_reset',
        referenceId: resetRequest._id
      });
    }
  } else if (status === 'rejected') {
    // Notify the employee of rejection
    await Notification.create({
      userId: resetRequest.employeeId,
      message: `Your password reset request was rejected. Remarks: ${remarks || 'None'}`,
      type: 'password_reset',
      referenceId: resetRequest._id
    });
  }

  await resetRequest.save();

  res.status(200).json({
    success: true,
    data: resetRequest
  });
});
