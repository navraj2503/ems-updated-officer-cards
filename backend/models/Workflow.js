// Import the Mongoose library to manage database schemas
const mongoose = require('mongoose');

// Define the schema for a Department Workflow
// This acts as a 'template' that defines the sequence of officers who must approve an application.
const WorkflowSchema = new mongoose.Schema({
  // The unique ID of the department this workflow belongs to
  deptId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department', // Reference the 'Department' collection
    required: true,
    unique: true, // Each department can only have one workflow template
  },
  // An ordered array of user IDs (Officers) representing the approval sequence
  // Index 0 is the first reviewer, index 1 is the second, and so on.
  officers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference the 'User' collection
  }],
}, {
  // Automatically manage 'createdAt' and 'updatedAt' timestamps
  timestamps: true,
  // Custom transformations when converting database data to JSON for the API
  toJSON: {
    virtuals: true,
    versionKey: false, // Don't show the internal Mongoose version (__v)
    transform: function (doc, ret) {
      delete ret._id; // Hide the MongoDB native '_id' and use 'id' instead
    },
  },
  toObject: { virtuals: true },
});

// Export the model so it can be used in controllers to define or fetch departmental workflows
module.exports = mongoose.model('Workflow', WorkflowSchema);
