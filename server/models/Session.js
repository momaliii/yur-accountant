import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  deviceInfo: {
    type: {
      platform: String,
      browser: String,
      os: String,
      device: String,
    },
    default: {},
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to update last activity
sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
