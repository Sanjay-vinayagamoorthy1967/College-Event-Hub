const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    useDefault: {
      type: Boolean,
      default: true,
    },
    templateUrl: {
      type: String,
      default: '',
    },
    placeholders: {
      type: Array,
      default: [], // Array of placeholder config: { id, type, name, x, y, w, h, font, fontSize, bold, italic, color, align, letterSpacing, lineHeight }
    },
    customTexts: {
      type: Array,
      default: [], // Array of custom text objects: { id, type, name, x, y, w, h, font, fontSize, bold, italic, color, align, letterSpacing, lineHeight }
    },
    customImages: {
      type: Array,
      default: [], // Array of custom images (logos, signatures, seals): { id, type, url, x, y, w, h }
    },
    watermark: {
      url: { type: String, default: '' },
      opacity: { type: Number, default: 0.5 },
    },
    showGrid: {
      type: Boolean,
      default: false,
    },
    snapToGrid: {
      type: Boolean,
      default: false,
    },
    zoom: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
