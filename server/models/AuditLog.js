import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    required: true,
    index: true,
  },
  resourceId: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

// TTL index to auto-delete old logs after 90 days (optional)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
