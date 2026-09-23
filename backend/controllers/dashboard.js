// Import the Mongoose library to handle database operations and ObjectIDs
const mongoose = require('mongoose');
// Import the asyncHandler utility to handle asynchronous errors automatically
const asyncHandler = require('../middleware/async');
// Import the Application model to query application statistics
const Application = require('../models/Application');
// Import the User model to count different types of users (employees/officers)
const User = require('../models/User');
// Import the Department model to count total departments for super admins
const Department = require('../models/Department');
// Import the Notice model to count total announcements for super admins
const Notice = require('../models/Notice');
// Import the PasswordResetRequest model
const PasswordResetRequest = require('../models/PasswordResetRequest');

// @desc    Calculate and retrieve statistics for the user dashboard
// @route   GET /api/dashboard/stats
// @access  Private
// This function runs when a user logs in and visits their dashboard.
// It detects the user's role and returns specific counts relevant to that role.
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  // Initialize an empty object to store the various counts
  const stats = {};

  // Logic for the Employee role
  if (req.user.role === 'employee') {
    // Count every application created by this specific employee
    stats.totalApplications = await Application.countDocuments({ employeeId: req.user.id });
    
    // Count applications that are currently being processed (pending or in progress)
    stats.pendingApplications = await Application.countDocuments({ 
      employeeId: req.user.id, 
      status: { $in: ['pending', 'in_progress'] } 
    });
    
    // Count applications that have reached the final 'approved' status
    stats.approvedApplications = await Application.countDocuments({ employeeId: req.user.id, status: 'approved' });
    
    // Count applications that were officially 'rejected'
    stats.rejectedApplications = await Application.countDocuments({ employeeId: req.user.id, status: 'rejected' });
    
    // Count applications that an officer has temporarily placed on 'hold'
    stats.heldApplications = await Application.countDocuments({ employeeId: req.user.id, status: 'hold' });
    
    // Count applications that have been returned to the employee or an officer for corrections
    stats.sentBackApplications = await Application.countDocuments({ 
      employeeId: req.user.id, 
      status: { $in: ['sent_back_to_employee', 'sent_back_to_officer'] } 
    });

    // Count pending password reset requests for this employee
    stats.pendingResetRequests = await PasswordResetRequest.countDocuments({
      employeeId: req.user.id,
      status: 'pending'
    });
  } 
  // Logic for the Officer role
  else if (req.user.role === 'officer') {
    // Convert the string ID of the logged-in officer into a MongoDB ObjectID for complex queries
    const officerId = new mongoose.Types.ObjectId(req.user.id);

    // Calculate 'Action Required': Applications currently waiting for this officer to review
    stats.actionRequired = await Application.countDocuments({
      $or: [
        {
          // Check if the application is active and the current workflow step belongs to this officer
          status: { $in: ['pending', 'in_progress'] },
          $expr: {
            $eq: [
              { $arrayElemAt: ["$steps.officerId", "$currentStep"] }, // Get the officer ID at the current step index
              officerId // Compare it to the current officer's ID
            ]
          }
        },
        {
          // Also include applications specifically returned ('sent back') to this officer
          status: 'sent_back_to_officer',
          sentBackTo: officerId
        }
      ]
    });

    // Calculate 'Pending for Me': Applications that are specifically in the normal queue for this officer
    stats.pendingForMe = await Application.countDocuments({
      status: { $in: ['pending', 'in_progress'] },
      $expr: {
        $eq: [
          { $arrayElemAt: ["$steps.officerId", "$currentStep"] },
          officerId
        ]
      }
    });

    // Calculate total pending workload across the officer's entire department
    stats.deptPending = await Application.countDocuments({
      deptId: req.user.deptId,
      status: { $in: ['pending', 'in_progress'] }
    });

    // Calculate 'History': Applications that this officer has already taken an action on
    stats.processedByMe = await Application.countDocuments({
      'steps': {
        $elemMatch: {
          officerId: officerId,
          status: { $ne: 'pending' } // If status is not 'pending', an action (Approve/Reject/etc) was taken
        }
      }
    });

    // Count all applications that have been rejected within the officer's department
    stats.rejected = await Application.countDocuments({
      deptId: req.user.deptId,
      status: 'rejected'
    });

    // Count applications currently paused ('hold') specifically at this officer's turn
    stats.heldForMe = await Application.countDocuments({
      status: 'hold',
      $expr: {
        $eq: [
          { $arrayElemAt: ["$steps.officerId", "$currentStep"] },
          officerId
        ]
      }
    });

    // Count applications that are currently in a 'sent back' state specifically for this officer
    stats.sentBackToMe = await Application.countDocuments({
      status: 'sent_back_to_officer',
      sentBackTo: officerId
    });
  } 
  // Logic for the Department Admin role
  else if (req.user.role === 'dept_admin') {
    // Count total employees registered under this admin's department
    stats.totalEmployees = await User.countDocuments({ deptId: req.user.deptId, role: 'employee' });
    
    // Count total officers registered under this admin's department
    stats.totalOfficers = await User.countDocuments({ deptId: req.user.deptId, role: 'officer' });
    
    // Count every application submitted to this department
    stats.totalApplications = await Application.countDocuments({ deptId: req.user.deptId });
    
    // Count applications in this department that are currently undergoing the workflow
    stats.pendingApplications = await Application.countDocuments({ 
      deptId: req.user.deptId, 
      status: { $in: ['pending', 'in_progress'] } 
    });
    
    // Count all applications in this department that have been fully approved
    stats.approvedApplications = await Application.countDocuments({ 
      deptId: req.user.deptId, 
      status: 'approved' 
    });
    
    // Count all applications in this department that have been rejected
    stats.rejectedApplications = await Application.countDocuments({ 
      deptId: req.user.deptId, 
      status: 'rejected' 
    });
    
    // Count all applications in this department currently on hold
    stats.heldApplications = await Application.countDocuments({ 
      deptId: req.user.deptId, 
      status: 'hold' 
    });

    // Count pending password reset requests for this department
    stats.pendingResetRequests = await PasswordResetRequest.countDocuments({
      deptId: req.user.deptId,
      status: 'pending'
    });
  } 
  // Logic for the Super Admin role (global visibility)
  else if (req.user.role === 'super_admin') {
    // Count total departments in the entire system
    stats.totalDepartments = await Department.countDocuments();
    
    // Count total registered users across all roles and departments
    stats.totalUsers = await User.countDocuments();
    
    // Count every single application in the entire system
    stats.totalApplications = await Application.countDocuments();
    
    // Count total notices/announcements posted globally
    stats.totalNotices = await Notice.countDocuments();

    // Count total pending password reset requests globally
    stats.pendingResetRequests = await PasswordResetRequest.countDocuments({ status: 'pending' });
  }

  // Return the calculated statistics to the frontend
  res.status(200).json({
    success: true,
    data: stats, // Contains the object populated with counts above
  });
});
