const mongoose = require('mongoose');

const collegeStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    batch: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      default: 'Male'
    },
    year: {
      type: String,
      default: 'III Year'
    },
    validUntil: {
      type: Date
    },
    qrVerificationCode: {
      type: String,
      required: [true, 'QR verification code is required'],
      unique: true,
      trim: true
    },
    isDisabled: {
      type: Boolean,
      default: false
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    registeredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentInternal',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CollegeStudent', collegeStudentSchema);
