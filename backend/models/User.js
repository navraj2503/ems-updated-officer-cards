// Import Mongoose for defining the data schema
const mongoose = require('mongoose');
// Import bcrypt for secure password hashing
const bcrypt = require('bcryptjs');
// Import JSON Web Token for creating authentication tokens
const jwt = require('jsonwebtoken');

// Define the blueprint for every User document in the database
const UserSchema = new mongoose.Schema({
  // The person's first name
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
  },
  // The person's last name
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
  },
  // Their unique work email address used for login
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true, // Prevent two users from having the same email
  },
  // Their secret login password
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 3, // Basic validation for length
    select: false, // Don't include the password in API responses by default for security
  },
  // The user's permission level within the system
  role: {
    type: String,
    // Restrict to these specific system roles
    enum: ['employee', 'officer', 'dept_admin', 'super_admin'],
    default: 'employee',
  },
  // For 'officer' roles, this specifies their actual government designation
  officerRole: {
    type: String,
    enum: [
      'HOD', 'HOO', 'Section Officer', 'Secretary', 'Joint Secretary',
      'Deputy Secretary', 'Under Secretary', 'Superintendent', 'Assistant Superintendent'
    ],
    default: null,
  },
  // The ID of the department the user belongs to
  deptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department', // Link this ID to a document in the 'Department' collection
    default: null,
  },
  // The filename of their profile picture
  profileImage: {
    type: String,
    default: 'default-profile.png',
  },
  // Automatic timestamp of when the user was created
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
    versionKey: false, // Don't show the internal '__v' field
    transform: function (doc, ret) {
      delete ret._id; // Hide the MongoDB '_id' and use the 'id' virtual instead
    },
  },
  toObject: { virtuals: true },
});

// ===== PRE-SAVE HOOK =====
// This function runs automatically right before a user is saved to the database.
UserSchema.pre('save', async function (next) {
  // If the password field hasn't changed (e.g., updating profile image), skip hashing
  if (!this.isModified('password')) {
    return next();
  }
  // Generate a security 'salt' (random data) to make the hash more secure
  const salt = await bcrypt.genSalt(10);
  // Hash the plain-text password and store the result
  this.password = await bcrypt.hash(this.password, salt);
});

// ===== INSTANCE METHODS =====
// These functions are available on every individual user object (e.g., user.matchPassword())

// Create a signed JWT token used for authenticating future requests
UserSchema.methods.getSignedJwtToken = function () {
  // The token contains the user's ID and is signed with a secret key from the environment
  return jwt.sign({ id: this._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE, // Token expires after a set time (e.g., 30 days)
  });
};

// Compare an incoming plain-text password with the hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // Bcrypt securely handles the comparison logic
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the compiled model so it can be used in controllers
module.exports = mongoose.model('User', UserSchema);
