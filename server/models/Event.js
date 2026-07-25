const mongoose = require('mongoose');

const CATEGORIES = ['Tech', 'Non-Tech', 'Workshop', 'Hackathon', 'Sports', 'Seminar', 'Cultural'];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    poster: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    internalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    externalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    seatLimit: {
      type: Number,
      required: [true, 'Seat limit is required'],
      min: [1, 'Seat limit must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    schedule: [
      {
        time: { type: String, required: true },
        activity: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    rules: [
      {
        type: String,
      },
    ],
    prizes: [
      {
        position: { type: String, required: true },
        amount: { type: Number, default: 0 },
        description: { type: String, default: '' },
      },
    ],
    coordinators: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        role: { type: String, default: 'Coordinator' },
      },
    ],
    brochureUrl: {
      type: String,
      default: '',
    },
    organizer: {
      type: String,
      default: 'College Event Hub',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
    registrationOpen: {
      type: Boolean,
      default: true,
    },
    registrationClosedAt: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    lastDate: {
      type: Date,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    firstPrize: {
      winnerName: String,
      collegeName: String,
      department: String,
      year: String,
      prizeType: String,
      cashAmount: { type: Number, default: 0 },
      photoUrl: String
    },
    secondPrize: {
      winnerName: String,
      collegeName: String,
      department: String,
      year: String,
      prizeType: String,
      cashAmount: { type: Number, default: 0 },
      photoUrl: String
    },
    thirdPrize: {
      winnerName: String,
      collegeName: String,
      department: String,
      year: String,
      prizeType: String,
      cashAmount: { type: Number, default: 0 },
      photoUrl: String
    },
    certificateTemplateType: {
      type: String,
      enum: ['default', 'custom'],
      default: 'custom',
    },
    certificateTemplatePath: {
      type: String,
      default: '',
    },
    certificateTemplateId: {
      type: String,
      default: '',
    },
    certificateEditorLayout: {
      type: Object,
      default: {},
    }
  },
  { timestamps: true }
);

// Text index for search
eventSchema.index({ title: 'text', description: 'text', venue: 'text' });

// Unique compound index to prevent overlapping race conditions at DB level
eventSchema.index({ venue: 1, date: 1, startTime: 1 }, { unique: true });

eventSchema.virtual('eventId').get(function() {
  return this._id.toHexString();
});
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
