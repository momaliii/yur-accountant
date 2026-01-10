import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  keyPrefix: {
    type: String,
    required: true,
  },
  permissions: [{
    type: String,
    enum: [
      'read:clients',
      'write:clients',
      'read:income',
      'write:income',
      'read:expenses',
      'write:expenses',
      'read:all',
      'write:all',
    ],
  }],
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes
apiKeySchema.index({ userId: 1, isActive: 1 });
// Note: 'key' field has unique: true, which automatically creates an index

// Generate API key
apiKeySchema.statics.generateKey = function () {
  const prefix = 'yur_';
  const randomBytes = crypto.randomBytes(32);
  const key = prefix + randomBytes.toString('base64url');
  return key;
};

// Check if key is expired
apiKeySchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Record usage
apiKeySchema.methods.recordUsage = function () {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

const APIKey = mongoose.model('APIKey', apiKeySchema);

export default APIKey;
