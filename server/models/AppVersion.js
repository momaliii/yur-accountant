import mongoose from 'mongoose';

const appVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    trim: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ['ios', 'android', 'web'],
    index: true,
  },
  buildNumber: {
    type: String,
    required: true,
  },
  releaseNotes: {
    type: String,
    default: '',
  },
  downloadUrl: {
    type: String,
    default: '',
  },
  manifestUrl: {
    type: String,
    default: '',
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  minSupportedVersion: {
    type: String,
    default: null,
  },
  updateSize: {
    type: Number, // in bytes
    default: 0,
  },
  checksum: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes
appVersionSchema.index({ platform: 1, isActive: 1 });
appVersionSchema.index({ platform: 1, version: -1 });

const AppVersion = mongoose.model('AppVersion', appVersionSchema);

export default AppVersion;
