// Import the Mongoose library to define schemas and interact with MongoDB
const mongoose = require('mongoose');

// Define the schema for an individual step within the application workflow
// Each application contains an array of these steps representing the sequence of officers
const StepSchema = new mongoose.Schema({
  // The ID of the officer assigned to this specific step
  officerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference the User collection
    required: true,
  },
  // The status of this specific step in the workflow
  status: {
    type: String,
    // Restrict the status to these specific values
    enum: ['pending', 'approved', 'rejected', 'sent_back', 'sent_back_to_officer', 'sent_back_to_employee', 'hold', 'unhold'],
    default: 'pending', // Steps start as 'pending'
  },
  // Optional note or remarks provided by the officer during their review
  note: {
    type: String,
    default: '',
  },
  // The timestamp of when the officer took an action on this step
  actionAt: {
    type: Date,
    default: null,
  },
}, {
  // Ensure virtual fields are included when converting the document to JSON or Object
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define the schema for a file attachment
const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, required: true }
}, { _id: false });

// Define the main schema for an Application
const ApplicationSchema = new mongoose.Schema({
  // The ID of the employee who created the application
  employeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference the User collection
    required: true,
  },
  // The ID of the department the application belongs to
  deptId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department', // Reference the Department collection
    required: true,
  },
  // The title or subject of the application
  title: {
    type: String,
    required: [true, 'Please add a title'], // Validation: title is mandatory
    trim: true, // Remove leading/trailing whitespace
  },
  // Detailed explanation or content of the application
  description: {
    type: String,
    required: [true, 'Please add a description'], // Validation: description is mandatory
  },
  // The category of the application (e.g., "Casual Leave", "Asset Request")
  applicationType: {
    type: String,
    required: [true, 'Please specify the application type'],
  },
  // If 'Other' was selected, this stores the custom category name
  customApplicationType: {
    type: String,
    default: null,
  },
  // The overall status of the entire application lifecycle
  status: {
    type: String,
    // Restrict the status to these specific values
    enum: ['draft', 'submitted', 'pending', 'in_progress', 'approved', 'rejected', 'sent_back', 'sent_back_to_officer', 'sent_back_to_employee', 'hold'],
    default: 'draft', // Applications start as 'draft' and are invisible to officers
  },
  // If the application was sent back, this stores the ID of the officer who did it
  sentBackBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  // If the application was sent back, this stores the ID of the recipient (employee or officer)
  sentBackTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  // The index of the current officer in the 'steps' array who needs to take action
  currentStep: {
    type: Number,
    default: 0,
  },
  // Array of sequential steps (officers) this application must pass through
  steps: [StepSchema],
  // Array of files or attachments uploaded with the application
  files: [FileSchema],
  // The timestamp of when the application was formally submitted
  submittedAt: {
    type: Date,
    default: null,
  },
  // A permanent, immutable record of every action taken on this application
  workflowHistory: [{
    actionType: String, // Type of action (e.g., 'submitted', 'approved', 'rejected')
    performedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // Who took the action
    },
    performedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // Who was the target (if applicable, e.g., in 'sent_back')
    },
    remarks: String, // Any comments provided during the action
    timestamp: String, // Readable date/time string
    status: String, // The application status resulting from this action
  }],
}, {
  // Automatically manage 'createdAt' and 'updatedAt' timestamps
  timestamps: true,
  // Custom transformations when converting the document for the API response
  toJSON: {
    virtuals: true,
    versionKey: false, // Don't include the internal Mongoose version key (__v)
    transform: function (doc, ret) {
      delete ret._id; // Use the 'id' virtual instead of '_id'
    },
  },
  toObject: { virtuals: true },
});

// Export the compiled model for use in other parts of the application
module.exports = mongoose.model('Application', ApplicationSchema);
