// Import the Mongoose library to interact with the MongoDB database
const mongoose = require('mongoose');
// Import the User model to perform database operations on users
const User = require('../models/User');
// Import the custom error response class for structured error handling
const ErrorResponse = require('../utils/errorResponse');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');
// Import the Application model to manage application data
const Application = require('../models/Application');
// Import the Workflow model to access department-specific workflow steps
const Workflow = require('../models/Workflow');
// Import the Notification model to create and manage system notifications
const Notification = require('../models/Notification');
// Import the ActivityLog model to record user actions for auditing
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all applications based on user role and filters
// @route   GET /api/applications
// @access  Private
// This function runs when a user visits the applications list page.
// It receives 'req' (request) which contains user info and query params, and 'res' (response) to send data back.
exports.getApplications = asyncHandler(async (req, res, next) => {
  // Initialize a variable to hold the database query
  let query;
  // Extract 'status' and 'view' from the URL query parameters (e.g., ?status=pending&view=inbox)
  const { status, view } = req.query;

  // Initialize an empty object to build the MongoDB filter criteria
  let queryFilter = {};

  // Check if the logged-in user is an employee
  if (req.user.role === 'employee') {
    // Employees should only see applications they created
    queryFilter.employeeId = req.user.id;
  } 
  // Check if the logged-in user is an officer
  else if (req.user.role === 'officer') {
    // If the officer is looking at their 'inbox' (applications requiring their action)
    if (view === 'inbox') {
      // Use $or to find applications matching any of the three conditions below
      queryFilter = {
        $or: [
          {
            // Condition 1: Application is currently waiting for a review
            status: { $in: ['pending', 'in_progress'] },
            // Use $expr to compare fields within the same document
            $expr: {
              // Check if the officer at the current step index matches the logged-in officer's ID
              $eq: [
                { $arrayElemAt: ["$steps.officerId", "$currentStep"] },
                new mongoose.Types.ObjectId(req.user.id)
              ]
            }
          },
          {
            // Condition 2: Application was specifically sent back to this officer for corrections
            status: 'sent_back_to_officer',
            sentBackTo: req.user.id
          },
          {
            // Condition 3: Application is on hold at this officer's current step
            status: 'hold',
            $expr: {
              $eq: [
                { $arrayElemAt: ["$steps.officerId", "$currentStep"] },
                new mongoose.Types.ObjectId(req.user.id)
              ]
            }
          }
        ]
      };
    } 
    // If the officer is looking at applications they have already processed
    else if (view === 'processed') {
      queryFilter = {
        // Use $elemMatch to find applications where this officer appears in any step with a non-pending status
        'steps': {
          $elemMatch: {
            officerId: req.user.id,
            status: { $ne: 'pending' }
          }
        }
      };
    } 
    // If the officer is looking at all applications within their department
    else if (view === 'department') {
      queryFilter = {
        deptId: req.user.deptId
      };
    } 
    // Default view for officers: show everything they are involved in or created
    else {
      queryFilter = {
        $or: [
          { 'steps.officerId': req.user.id },
          { employeeId: req.user.id }
        ]
      };
    }
  } 
  // Check if the user is a department administrator
  else if (req.user.role === 'dept_admin') {
    // Department admins see all applications within their specific department
    queryFilter.deptId = req.user.deptId;
  }

  // If a specific status filter was provided in the URL and it's not the inbox view
  if (status && view !== 'inbox') {
    // Add the status to our final filter object
    queryFilter.status = status;
  }

  // Find applications in the database that match our built filter
  query = Application.find(queryFilter);

  // Populate references to other collections to get full details instead of just IDs
  const applications = await query.populate({
    path: 'employeeId',
    select: 'firstName lastName email profileImage' // Only get these specific fields for the employee
  }).populate({
    path: 'deptId',
    select: 'name' // Only get the department name
  }).populate({
    path: 'steps.officerId',
    select: 'firstName lastName email officerRole profileImage' // Get officer details for each workflow step
  }).populate({
    path: 'sentBackBy',
    select: 'firstName lastName email officerRole profileImage' // Get details of who sent it back
  }).populate({
    path: 'sentBackTo',
    select: 'firstName lastName email officerRole profileImage' // Get details of who it was sent back to
  }).populate({
    path: 'workflowHistory.performedBy',
    select: 'firstName lastName email officerRole profileImage' // Get details of users in the action history
  }).populate({
    path: 'workflowHistory.performedTo',
    select: 'firstName lastName email officerRole profileImage' // Get details of targets in the action history
  });

  // Send a successful response back to the frontend with the application data
  res.status(200).json({
    success: true,
    count: applications.length, // Include the total number of applications found
    data: applications,
  });
});

// @desc    Get full details for a single application
// @route   GET /api/applications/:id
// @access  Private
// This function runs when a user clicks on a specific application to view its details.
exports.getApplication = asyncHandler(async (req, res, next) => {
  // Find the application by its unique ID provided in the URL parameter ':id'
  const application = await Application.findById(req.params.id).populate({
    path: 'employeeId',
    select: 'firstName lastName email profileImage'
  }).populate({
    path: 'deptId',
    select: 'name'
  }).populate({
    path: 'steps.officerId',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'sentBackBy',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'sentBackTo',
    select: 'firstName lastName email officerRole profileImage'
  });

  // If no application was found with that ID, return a 404 Not Found error
  if (!application) {
    return next(
      new ErrorResponse(`Application not found with id of ${req.params.id}`, 404)
    );
  }

  // Send the application details back to the frontend
  res.status(200).json({
    success: true,
    data: application,
  });
});

// @desc    Permanently delete an application
// @route   DELETE /api/applications/:id
// @access  Private
// This function runs when a user clicks 'Delete' on an application.
exports.deleteApplication = asyncHandler(async (req, res, next) => {
  // Find the application we want to delete
  const application = await Application.findById(req.params.id);

  // If the application doesn't exist, return a 404 error
  if (!application) {
    return next(new ErrorResponse(`Application not found`, 404));
  }

  // Determine if the current user is the person who created the application
  const isOwner = application.employeeId.toString() === req.user.id.toString();
  // Determine if the current user has administrative privileges
  const isAdmin = req.user.role === 'super_admin' || req.user.role === 'dept_admin';

  // If the user is neither the owner nor an admin, they are not allowed to delete it
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse(`Not authorized to delete this application`, 403));
  }

  // Remove the application from the database
  await application.deleteOne();

  // Create a record in the activity log to track this deletion
  await ActivityLog.create({
    userId: req.user.id,
    action: 'DELETE_APPLICATION',
    details: `Deleted application: ${application.title}`,
  });

  // Send a success message back
  res.status(200).json({
    success: true,
    data: {}, // Return an empty object as the application no longer exists
  });
});

// @desc    Create a new application as a 'draft'
// @route   POST /api/applications
// @access  Private (Employee)
// This function runs when an employee starts a new application.
exports.createApplication = asyncHandler(async (req, res, next) => {
  // Set the creator's ID and department ID from the logged-in user's data
  req.body.employeeId = req.user.id;
  req.body.deptId = req.user.deptId;
  // Initialize the status as 'draft' so it isn't visible to officers yet
  req.body.status = 'draft';

  // Defensive check for files field
  if (req.body.files && !Array.isArray(req.body.files)) {
    req.body.files = [];
  }

  // Create the application document in the database using data from the request body
  const application = await Application.create(req.body);

  // Log that a new draft was created
  await ActivityLog.create({
    userId: req.user.id,
    action: 'CREATE_APPLICATION',
    details: `Created draft application: ${application.title}`,
  });

  // Return the newly created application with a 201 Created status
  res.status(201).json({
    success: true,
    data: application,
  });
});

// @desc    Submit a draft application to start the workflow
// @route   PUT /api/applications/:id/submit
// @access  Private (Employee)
// This function runs when an employee clicks 'Submit' on their draft application.
exports.submitApplication = asyncHandler(async (req, res, next) => {
  // Find the draft application by ID
  let application = await Application.findById(req.params.id);

  // Return error if application doesn't exist
  if (!application) {
    return next(new ErrorResponse(`Application not found`, 404));
  }

  // Fetch the workflow rules defined for the application's department
  const workflow = await Workflow.findOne({ deptId: application.deptId });

  // If no workflow is set up, the application cannot be processed
  if (!workflow || workflow.officers.length === 0) {
    return next(new ErrorResponse(`No workflow defined for this department`, 400));
  }

  // Create the sequential steps for the application based on the department's workflow
  const steps = workflow.officers.map((officerId) => ({
    officerId, // Assign the officer from the workflow template
    status: 'pending', // Initial status for each step is pending
    note: '',
    actionAt: null,
  }));

  // Update the application status to 'pending' and attach the workflow steps
  application = await Application.findByIdAndUpdate(
    req.params.id,
    {
      status: 'pending', // Main application status
      submittedAt: Date.now(), // Record the submission time
      steps, // Attach the generated workflow steps
      currentStep: 0, // Start at the first officer (index 0)
    },
    { new: true, runValidators: true } // Return the updated document and run schema validations
  ).populate({
    path: 'employeeId',
    select: 'firstName lastName email profileImage'
  }).populate({
    path: 'deptId',
    select: 'name'
  }).populate({
    path: 'steps.officerId',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'sentBackBy',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'sentBackTo',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'workflowHistory.performedBy',
    select: 'firstName lastName email officerRole profileImage'
  }).populate({
    path: 'workflowHistory.performedTo',
    select: 'firstName lastName email officerRole profileImage'
  });

  // Create a notification for the very first officer in the sequence
  await Notification.create({
    userId: steps[0].officerId,
    message: `New application submitted: ${application.title}`,
    type: 'application_submitted',
    referenceId: application._id,
  });

  // Prepare a readable timestamp for the workflow history
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;

  // Record the 'submitted' action in the application's permanent history log
  application.workflowHistory.push({
    actionType: 'submitted',
    performedBy: req.user.id,
    remarks: 'Initial submission',
    timestamp,
    status: 'pending'
  });

  // Save the application changes
  await application.save();

  // Log the submission activity
  await ActivityLog.create({
    userId: req.user.id,
    action: 'SUBMIT_APPLICATION',
    details: `Submitted application: ${application.title}`,
  });

  // Return the submitted application data
  res.status(200).json({
    success: true,
    data: application,
  });
});

// @desc    Process an application (Approve, Reject, Send Back, Hold)
// @route   PUT /api/applications/:id/process
// @access  Private (Officer)
// This function runs when an officer takes any action on an application in their inbox.
exports.processApplication = asyncHandler(async (req, res, next) => {
  // Extract the action, note, and optional target user ID from the request body
  const { action, note, targetId } = req.body; 
  // Find the application being processed
  let application = await Application.findById(req.params.id);

  // Return error if not found
  if (!application) {
    return next(new ErrorResponse(`Application not found`, 404));
  }

  // Get the current workflow step index and the step details
  const currentStepIndex = application.currentStep;
  const currentStep = application.steps[currentStepIndex];

  // Verify if the logged-in officer is the one assigned to the current step
  const isCurrentlyAssigned = currentStep.officerId.toString() === req.user.id.toString();
  // Check if this application was previously sent back to this specific officer
  const isSentBackToMe = application.status === 'sent_back_to_officer' && 
                         application.sentBackTo && 
                         application.sentBackTo.toString() === req.user.id.toString();

  // Security Check: Ensure the officer is actually allowed to touch this application right now
  if (application.status === 'sent_back_to_officer' || application.status === 'sent_back_to_employee') {
    // If it's sent back but not to the current user, block them
    if (!isSentBackToMe) {
      return next(new ErrorResponse(`This application is currently sent back for corrections. You cannot take action until it is resubmitted.`, 403));
    }
  } else {
    // If it's a standard flow but not assigned to this user, block them
    if (!isCurrentlyAssigned) {
      return next(new ErrorResponse(`Not authorized to process this application`, 403));
    }
  }

  // Update the status and note for the current step in the steps array
  application.steps[currentStepIndex].status = action;
  application.steps[currentStepIndex].note = note;
  application.steps[currentStepIndex].actionAt = Date.now();

  // Initialize variables to determine what the application's next status and step will be
  let nextStatus = application.status;
  let nextStep = currentStepIndex;

  // Logic for when an officer clicks 'Approve'
  if (action === 'approved') {
    // Check if this was the very last step in the workflow
    if (currentStepIndex === application.steps.length - 1) {
      // Entire application is now fully approved
      nextStatus = 'approved';
      
      // Notify the employee that their application is finished and approved
      await Notification.create({
        userId: application.employeeId,
        message: `Congratulations! Your application ${application.title} has been fully approved.`,
        type: 'application_approved',
        referenceId: application._id,
      });
    } 
    // If there are more steps remaining in the workflow
    else {
      // Application moves to the next officer
      nextStatus = 'in_progress';
      nextStep = currentStepIndex + 1;
      
      // Notify the next officer that they have a new application to review
      await Notification.create({
        userId: application.steps[nextStep].officerId,
        message: `Application forwarded to you: ${application.title}`,
        type: 'application_submitted',
        referenceId: application._id,
      });
      
      // Notify the employee that their application has progressed to the next level
      await Notification.create({
        userId: application.employeeId,
        message: `Your application ${application.title} has been approved at Step ${currentStepIndex + 1} and forwarded.`,
        type: 'application_in_progress',
        referenceId: application._id,
      });
    }
    // Since it's being approved forward, clear any existing 'sent back' flags
    application.sentBackBy = undefined;
    application.sentBackTo = undefined;
  } 
  // Logic for when an officer clicks 'Reject'
  else if (action === 'rejected') {
    // Entire application is immediately terminated as rejected
    nextStatus = 'rejected';
  } 
  // Logic for when an officer clicks 'Send Back' (to employee or previous officer)
  else if (action === 'sent_back') {
    // A target user (employee or previous officer) must be specified
    if (!targetId) {
      return next(new ErrorResponse(`Please specify a target for send back`, 400));
    }

    // Find the user we are sending the application back to
    const targetUser = await User.findById(targetId);
    
    // Return error if target user doesn't exist
    if (!targetUser) {
      return next(new ErrorResponse(`Target user not found`, 404));
    }

    // If sending back to the original applicant (Employee)
    if (targetUser.role === 'employee') {
      nextStatus = 'sent_back_to_employee';
      // We keep nextStep at the current index so it returns directly to this officer after resubmission
      nextStep = currentStepIndex;
    } 
    // If sending back to a previous officer in the workflow
    else {
      nextStatus = 'sent_back_to_officer';
      // Find the index of the step belonging to the target officer
      const targetStepIndex = application.steps.findIndex(s => s.officerId.toString() === targetId.toString());
      if (targetStepIndex !== -1) {
        // Jump the workflow back to that officer's step
        nextStep = targetStepIndex;
      }
    }

    // Store who sent it back and to whom for tracking
    application.sentBackBy = req.user.id;
    application.sentBackTo = targetId;

    // Notify the recipient that the application has been returned to them
    await Notification.create({
      userId: targetId,
      message: `Application sent back to you for correction: ${application.title}`,
      type: 'application_sent_back',
      referenceId: application._id,
    });
  } 
  // Logic for when an officer clicks 'Hold'
  else if (action === 'hold') {
    // Application is paused at the current step
    nextStatus = 'hold';
    
    // Notify the employee that their application is temporarily on hold
    await Notification.create({
      userId: application.employeeId,
      message: `Your application ${application.title} has been put on hold`,
      type: 'application_hold',
      referenceId: application._id,
    });
  } 
  // Logic for when an officer clicks 'Unhold'
  else if (action === 'unhold') {
    // Resume the application status based on whether it's at the start or middle of workflow
    nextStatus = currentStepIndex === 0 ? 'pending' : 'in_progress';
    
    // Notify the employee that their application is active again
    await Notification.create({
      userId: application.employeeId,
      message: `Your application ${application.title} is now active again`,
      type: 'application_unhold',
      referenceId: application._id,
    });
  }

  // Apply the calculated next status and step index to the application document
  application.status = nextStatus;
  application.currentStep = nextStep;

  // Prepare timestamp for the history log
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;

  // Record this processing action in the permanent history log
  application.workflowHistory.push({
    actionType: action, // e.g., 'approved', 'rejected', 'sent_back'
    performedBy: req.user.id, // Who took the action
    // If it was a send-back, record who it was sent to. If it was an approval, record who gets it next.
    performedTo: action === 'sent_back' ? targetId : (action === 'approved' && nextStep !== currentStepIndex ? application.steps[nextStep].officerId : undefined),
    remarks: note || `Action: ${action}`, // Include any notes provided by the officer
    timestamp,
    status: nextStatus // Record the resulting application status
  });

  // Save all changes to the database
  await application.save();
  
  // Re-populate history fields to get user names for the updated document
  await application.populate([
    { path: 'workflowHistory.performedBy', select: 'firstName lastName officerRole' },
    { path: 'workflowHistory.performedTo', select: 'firstName lastName officerRole' }
  ]);

  // Re-populate main references to ensure designations and images are fresh for the response
  await application.populate({
    path: 'employeeId',
    select: 'firstName lastName email profileImage'
  });
  await application.populate({
    path: 'steps.officerId',
    select: 'firstName lastName email officerRole profileImage'
  });
  await application.populate({
    path: 'sentBackBy',
    select: 'firstName lastName email officerRole profileImage'
  });
  await application.populate({
    path: 'sentBackTo',
    select: 'firstName lastName email officerRole profileImage'
  });

  // Send a specific notification for other actions that didn't already have one (like rejection)
  if (action !== 'approved' && action !== 'sent_back') {
    await Notification.create({
      userId: application.employeeId,
      message: `Your application ${application.title} has been ${action}`,
      type: `application_${action}`,
      referenceId: application._id,
    });
  }

  // Log the processing activity for auditing
  await ActivityLog.create({
    userId: req.user.id,
    action: `PROCESS_APPLICATION_${action.toUpperCase()}`,
    details: `Processed application: ${application.title} as ${action}`,
  });

  // Send the updated application data back to the frontend
  res.status(200).json({
    success: true,
    data: application,
  });
});

// @desc    Update an application (Edit a draft or a sent-back application)
// @route   PUT /api/applications/:id
// @access  Private (Employee)
// This function runs when an employee resubmits an application after making corrections.
exports.updateApplication = asyncHandler(async (req, res, next) => {
  // Find the application being edited
  let application = await Application.findById(req.params.id);

  // Return error if not found
  if (!application) {
    return next(new ErrorResponse(`Application not found`, 404));
  }

  // Only allow editing if the application is currently a draft or has been sent back for corrections
  const allowedStatuses = ['sent_back', 'sent_back_to_employee', 'sent_back_to_officer', 'draft'];
  if (!allowedStatuses.includes(application.status)) {
    return next(new ErrorResponse(`Cannot edit application in current status: ${application.status}`, 400));
  }

  // Special logic: If the user is submitting the edited version (Resubmission)
  if (req.body.status === 'submitted') {
    // Determine the status based on whether it's at the start or middle of the workflow
    const targetStatus = application.currentStep === 0 ? 'pending' : 'in_progress';
    req.body.status = targetStatus;
    
    // Prepare timestamp for history
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;

    // Add a 'resubmitted' entry to the workflow history
    application.workflowHistory.push({
      actionType: 'resubmitted',
      performedBy: req.user.id,
      remarks: req.body.note || 'Resubmitted after correction',
      timestamp,
      status: targetStatus
    });

    // Notify the officer who is currently waiting for this application
    const currentOfficerId = application.steps[application.currentStep].officerId;
    await Notification.create({
      userId: currentOfficerId,
      message: `Application resubmitted: ${application.title}`,
      type: 'application_resubmitted',
      referenceId: application._id,
    });
    
    // Reset the current workflow step to 'pending' so the officer can review it again
    application.steps[application.currentStep].status = 'pending';
    application.steps[application.currentStep].actionAt = null;
    
    // Clear the 'sent back' tracking fields as the corrections have been made
    application.sentBackBy = undefined;
    application.sentBackTo = undefined;
    application.status = targetStatus;
  }

  // Update content fields if they were provided in the request
  if (req.body.title) application.title = req.body.title;
  if (req.body.description) application.description = req.body.description;
  
  // Ensure files is an array before assigning
  if (req.body.files) {
    application.files = Array.isArray(req.body.files) ? req.body.files : [];
  }

  // Save the updated application to the database
  await application.save();

  // Log whether this was a simple update or a formal resubmission
  await ActivityLog.create({
    userId: req.user.id,
    action: req.body.status === 'submitted' ? 'RESUBMIT_APPLICATION' : 'UPDATE_APPLICATION',
    details: `${req.body.status === 'submitted' ? 'Resubmitted' : 'Updated'} application: ${application.title}`,
  });

  // Re-fetch the application and populate all fields to return the most up-to-date data
  const updatedApp = await Application.findById(application._id)
    .populate({ path: 'employeeId', select: 'firstName lastName email profileImage' })
    .populate({ path: 'deptId', select: 'name' })
    .populate({ path: 'steps.officerId', select: 'firstName lastName email officerRole profileImage' })
    .populate({ path: 'sentBackBy', select: 'firstName lastName email officerRole profileImage' })
    .populate({ path: 'sentBackTo', select: 'firstName lastName email officerRole profileImage' })
    .populate({ path: 'workflowHistory.performedBy', select: 'firstName lastName officerRole profileImage' })
    .populate({ path: 'workflowHistory.performedTo', select: 'firstName lastName officerRole profileImage' });

  // Send the updated application data back to the frontend
  res.status(200).json({
    success: true,
    data: updatedApp,
  });
});
