// Import the Mongoose library to define data schemas for MongoDB
const mongoose = require('mongoose');

// Define the structure for a Department record
const DepartmentSchema = new mongoose.Schema({
  // The formal name of the department (e.g., "Finance Department")
  name: {
    type: String,
    required: [true, 'Please add a department name'], // Validation: name must be provided
    unique: true, // Prevent duplicate department names in the system
    trim: true, // Automatically remove accidental spaces from the beginning or end
  },
}, {
  // Automatically record 'createdAt' and 'updatedAt' timestamps for every department
  timestamps: true,
  // Custom logic for converting database documents to JSON (for API responses)
  toJSON: {
    virtuals: true, // Include virtual fields like 'id'
    versionKey: false, // Hide the internal Mongoose versioning (__v)
    transform: function (doc, ret) {
      delete ret._id; // Hide the MongoDB native '_id' and use the cleaner 'id' instead
    },
  },
  toObject: { virtuals: true },
});

// Export the compiled model so it can be used in controllers to find or create departments
module.exports = mongoose.model('Department', DepartmentSchema);
