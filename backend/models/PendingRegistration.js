const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['student_internal', 'student_external', 'admin']
  },
  userData: {
    type: Object,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  otpExpiry: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900 // Document will automatically be deleted after 15 minutes (900 seconds)
  }
});

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
