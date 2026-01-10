import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'admins', 'specific'],
    default: 'all',
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes
announcementSchema.index({ isActive: 1, startDate: -1 });
announcementSchema.index({ targetAudience: 1 });

// Check if announcement should be shown to user
announcementSchema.methods.shouldShowToUser = function (userId, userRole) {
  if (!this.isActive) return false;
  if (new Date() < this.startDate) return false;
  if (this.endDate && new Date() > this.endDate) return false;

  if (this.targetAudience === 'all') return true;
  if (this.targetAudience === 'admins' && userRole === 'admin') return true;
  if (this.targetAudience === 'users' && userRole === 'user') return true;
  if (this.targetAudience === 'specific' && this.targetUsers.includes(userId)) return true;

  return false;
};

// Record view
announcementSchema.methods.recordView = function (userId) {
  const existingView = this.views.find(v => v.userId.toString() === userId.toString());
  if (!existingView) {
    this.views.push({ userId, viewedAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
