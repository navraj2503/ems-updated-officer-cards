// Import the Mongoose library to define the data schema
const mongoose = require('mongoose');

// Define the blueprint for every Password Reset Request in the database
const PasswordResetRequestSchema = new mongoose.Schema({
  // The ID of the employee who is requesting the reset
  employeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference the User collection
    required: true,
  },
  // The name of the employee (stored for easy display in lists)
  employeeName: {
    type: String,
    required: true,
  },
  // The email of the employee
  email: {
    type: String,
    required: true,
  },
  // The department ID of the employee
  deptId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department',
    required: true,
  },
  // The current status of the request
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  // The ID of the administrator who reviewed/processed the request
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  // The timestamp of when the request was reviewed
  reviewedAt: {
    type: Date,
  },
  // Optional remarks provided by the administrator
  remarks: {
    type: String,
  },
  // The timestamp of when the request was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // Automatically manage 'createdAt' and 'updatedAt' fields
  timestamps: true,
  // Custom transformations when converting to JSON (e.g., for API responses)
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      delete ret._id;
    },
  },
  toObject: { virtuals: true },
});

// Export the compiled model
module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
