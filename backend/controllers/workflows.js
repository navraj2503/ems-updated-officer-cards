// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the Workflow model to manage the sequence of officers for each department
const Workflow = require('../models/Workflow');

// @desc    Retrieve the workflow officer sequence for a specific department
// @route   GET /api/workflows/:deptId
// @access  Private (Required to know who the approvers are during application submission)
exports.getWorkflow = asyncHandler(async (req, res, next) => {
  // Find the workflow document that matches the given department ID
  // We use '.populate('officers')' to get the full names and details of the assigned officers
  const workflow = await Workflow.findOne({ deptId: req.params.deptId }).populate('officers');

  // If no workflow has been set up for this department yet
  if (!workflow) {
    // Return a default empty workflow structure instead of an error
    return res.status(200).json({
      success: true,
      data: { deptId: req.params.deptId, officers: [] }
    });
  }

  // Send the department's workflow data back
  res.status(200).json({
    success: true,
    data: workflow,
  });
});

// @desc    Create a new workflow or update an existing one for a department
// @route   POST /api/workflows
// @access  Private/Admin (Only Department Admins or Super Admins can configure workflows)
exports.upsertWorkflow = asyncHandler(async (req, res, next) => {
  // Extract the department ID and the array of officer IDs from the request body
  const { deptId, officers } = req.body;

  // Check if a workflow already exists for this department
  let workflow = await Workflow.findOne({ deptId });

  // If it exists, update the officer sequence
  if (workflow) {
    workflow.officers = officers;
    // Save the changes. This will also update the 'updatedAt' timestamp automatically.
    await workflow.save();
  } 
  // If it doesn't exist, create a brand new workflow document
  else {
    workflow = await Workflow.create({ deptId, officers });
  }

  // Return the updated or newly created workflow data
  res.status(200).json({
    success: true,
    data: workflow,
  });
});
