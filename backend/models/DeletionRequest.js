const mongoose = require('mongoose');

const deletionRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    studentModel: {
      type: String,
      enum: ['StudentInternal', 'StudentExternal'],
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    usn: { type: String, default: '' },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);
