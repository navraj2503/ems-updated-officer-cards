// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the User model to manage user accounts in the database
const User = require('../models/User');

// @desc    Retrieve a list of all users based on access level
// @route   GET /api/users
// @access  Private/Admin
// This function runs when an admin (super or dept) wants to view the user list.
exports.getUsers = asyncHandler(async (req, res, next) => {
  // Initialize a variable to hold the database query
  let query;

  // Filter Logic: 
  // If the requester is tied to a department (Dept Admin, Employee, or Officer)
  if (req.user.role === 'dept_admin' || req.user.role === 'employee' || req.user.role === 'officer') {
    // Only show users who belong to the same department as the requester
    query = User.find({ deptId: req.user.deptId });
  } else {
    // Super Admins don't have a deptId and can see every user in the entire system
    query = User.find();
  }

  // Execute the query and 'populate' the deptId to get the actual department name/details
  const users = await query.populate('deptId');

  // Return the list of users and the total count
  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get full details for a single specific user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  // Find the user by the unique ID provided in the URL parameter ':id'
  const user = await User.findById(req.params.id).populate('deptId');

  // If the user doesn't exist, return a 404 Not Found error
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Send the user data back
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create a new user account manually
// @route   POST /api/users
// @access  Private/Admin (Usually Super Admin or Dept Admin)
exports.createUser = asyncHandler(async (req, res, next) => {
  // Create the user document in the database using data from the request body
  const user = await User.create(req.body);

  // Return the newly created user with a 201 Created status
  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update an existing user's information
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Find the user. We use '.select('+password')' so if a password change is requested, 
  // Mongoose can correctly handle the hashing in the pre-save hook.
  let user = await User.findById(req.params.id).select('+password');

  // Return error if user doesn't exist
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Define which fields the admin is allowed to update
  const fieldsToUpdate = [
    'firstName',
    'lastName',
    'email',
    'password',
    'role',
    'deptId',
    'officerRole',
    'profileImage',
  ];

  // Loop through each allowed field
  fieldsToUpdate.forEach((field) => {
    // If the field exists in the incoming request body
    if (req.body[field] !== undefined) {
      // Handle the case where a department is being removed (set to empty string)
      if (field === 'deptId' && req.body[field] === '') {
        user[field] = null;
      } 
      // Handle password updates: only update if the new password isn't just whitespace
      else if (field === 'password') {
        if (req.body[field].trim() !== '') {
          user[field] = req.body[field];
        }
      } 
      // For all other fields, simply copy the new value over
      else {
        user[field] = req.body[field];
      }
    }
  });

  // Save the changes. This triggers the 'pre-save' hooks (like password hashing).
  await user.save();

  // Return the updated user data
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Permanently delete a user account
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Find the user by ID and remove them from the database
  await User.findByIdAndDelete(req.params.id);

  // Send a success message back
  res.status(200).json({
    success: true,
    data: {}, // Return an empty object as the user no longer exists
  });
});
