// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the Department model to interact with department data in the database
const Department = require('../models/Department');

// @desc    Retrieve a list of all departments in the system
// @route   GET /api/departments
// @access  Public (Needed so employees can see their department info)
exports.getDepartments = asyncHandler(async (req, res, next) => {
  // Find all department documents in the database
  const departments = await Department.find();

  // Send the list back to the frontend
  res.status(200).json({
    success: true,
    count: departments.length, // Include the total count for UI stats
    data: departments,
  });
});

// @desc    Get details for a single specific department
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartment = asyncHandler(async (req, res, next) => {
  // Find the department by its unique ID
  const department = await Department.findById(req.params.id);

  // If the department doesn't exist, return a 404 Not Found error
  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }

  // Send the department details back
  res.status(200).json({
    success: true,
    data: department,
  });
});

// @desc    Add a new department to the system
// @route   POST /api/departments
// @access  Private/Admin (Only Super Admins can create departments)
exports.createDepartment = asyncHandler(async (req, res, next) => {
  // Create the department document using the name provided in the request body
  const department = await Department.create(req.body);

  // Return the newly created department with a 201 Created status
  res.status(201).json({
    success: true,
    data: department,
  });
});

// @desc    Update a department's name or information
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  // Find the department and update it with the new data
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document instead of the old one
    runValidators: true, // Ensure the new name follows the schema rules
  });

  // If no department was found to update, Mongoose handles this via null result
  if (!department) {
    return next(new ErrorResponse(`Department not found`, 404));
  }

  // Send the updated data back
  res.status(200).json({
    success: true,
    data: department,
  });
});

// @desc    Permanently delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  // Find the department by ID and remove it
  await Department.findByIdAndDelete(req.params.id);

  // Return success message
  res.status(200).json({
    success: true,
    data: {}, // Return empty object as the resource is gone
  });
});
