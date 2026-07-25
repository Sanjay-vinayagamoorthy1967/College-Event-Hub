const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'studentType',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'studentType',
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant'
    },
    studentType: {
      type: String,
      required: true,
      enum: ['StudentInternal', 'StudentExternal'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },
    certificateUrl: {
      type: String,
      default: '',
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'issued'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: {
      type: Date,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
