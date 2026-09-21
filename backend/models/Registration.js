const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const registrationSchema = new mongoose.Schema(
  {
    // Link to authenticated user
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'studentType',
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

    // Registration Form Fields
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    usn: {
      type: String,
      required: [true, 'USN / Student ID is required'],
      trim: true,
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    yearSemester: {
      type: String,
      required: [true, 'Year / Semester is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    foodPreference: {
      type: String,
      enum: ['veg', 'non-veg', 'none'],
      default: 'none',
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual',
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    teamName: {
      type: String,
      trim: true,
      default: '',
    },
    teamMembers: [
      {
        name: { type: String, required: true },
        usn: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
      }
    ],

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed', 'failed'],
      default: 'pending',
    },
    attendanceStatus: {
      type: String,
      enum: ['absent', 'present'],
      default: 'absent',
    },
    certificateStatus: {
      type: String,
      enum: ['not_eligible', 'eligible', 'approved', 'issued', 'released', 'generated'],
      default: 'not_eligible',
    },

    certificateNumber: {
      type: String,
      default: '',
    },
    // QR Code data
    qrCode: {
      type: String,
      default: '',
    },
    secureToken: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    qrData: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

registrationSchema.statics.generateCertificateNumber = async function () {
  const Counter = require('./Counter');
  const currentYear = new Date().getFullYear();
  const sequenceName = `CERT-${currentYear}`;
  const prefix = `${sequenceName}-`;
  
  // Find or initialize counter to avoid duplicate sequence generation
  let counter = await Counter.findOne({ _id: sequenceName });
  if (!counter) {
    const lastReg = await this.findOne({
      certificateNumber: { $regex: `^${prefix}` }
    }).sort({ certificateNumber: -1 });

    let initialSeq = 0;
    if (lastReg && lastReg.certificateNumber) {
      const lastNumStr = lastReg.certificateNumber.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        initialSeq = lastNum;
      }
    }

    try {
      await Counter.create({ _id: sequenceName, seq: initialSeq });
    } catch (err) {
      // Counter already created, ignore
    }
  }

  const result = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(result.seq).padStart(6, '0');
  return `${prefix}${seqStr}`;
};

// Prevent duplicate registrations
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
