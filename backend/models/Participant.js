const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    participantType: {
      type: String,
      enum: ['INTERNAL', 'EXTERNAL'],
      required: true,
    },
    SIN_NO: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
    },
    college: {
      type: String,
      required: true,
    },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Participant', participantSchema);
