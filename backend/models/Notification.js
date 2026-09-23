const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'application_submitted', 
      'application_approved', 
      'application_rejected', 
      'application_sent_back', 
      'application_in_progress',
      'application_hold',
      'application_unhold',
      'application_resubmitted',
      'password_reset',
      'notice_posted'
    ],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.ObjectId,
    required: false, // Can be application ID or notice ID
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      delete ret._id;
    },
  },
  toObject: { virtuals: true },
});

module.exports = mongoose.model('Notification', NotificationSchema);
