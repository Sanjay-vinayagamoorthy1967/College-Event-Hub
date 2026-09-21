const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentInternalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  role: { type: String, default: 'student' },
  type: { type: String, default: 'student_internal' },
  verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  // Google Auth Fields
  googleId: { type: String },
  profilePicture: { type: String },
  lastLoginTime: { type: Date }
}, { timestamps: true });

studentInternalSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentInternalSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('StudentInternal', studentInternalSchema);
