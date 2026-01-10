import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'info',
      'success',
      'warning',
      'error',
      'system',
      'user_action',
      'payment',
      'subscription',
      'announcement',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  actionUrl: String, // URL to navigate when clicked
  actionText: String, // Text for action button
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  expiresAt: Date, // Optional expiration date
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

// Mark as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Check if expired
notificationSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
