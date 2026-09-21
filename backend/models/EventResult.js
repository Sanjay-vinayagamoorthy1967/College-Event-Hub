const mongoose = require('mongoose');

const eventResultSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration', // Using Registration to get the participant details (individual or team)
      required: true,
    },
    position: {
      type: Number,
      required: true,
      enum: [1, 2, 3], // 1: First, 2: Second, 3: Third
    },
    prizeAmount: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

// Constraints
// 1. Only one 1st, 2nd, or 3rd prize per event
eventResultSchema.index({ eventId: 1, position: 1 }, { unique: true });

// 2. A participant can only hold one winning position per event
eventResultSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('EventResult', eventResultSchema);
