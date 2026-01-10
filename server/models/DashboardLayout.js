import mongoose from 'mongoose';

const dashboardLayoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  widgets: [{
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'stat-card',
        'chart',
        'quick-actions',
        'recent-activity',
        'goals',
        'clients',
        'calendar',
        'trends',
      ],
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    size: {
      w: { type: Number, default: 4 },
      h: { type: Number, default: 3 },
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  }],
  layout: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes
dashboardLayoutSchema.index({ userId: 1 });

const DashboardLayout = mongoose.model('DashboardLayout', dashboardLayoutSchema);

export default DashboardLayout;
