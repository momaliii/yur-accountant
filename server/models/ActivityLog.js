import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create_client',
      'update_client',
      'delete_client',
      'create_income',
      'update_income',
      'delete_income',
      'create_expense',
      'update_expense',
      'delete_expense',
      'create_debt',
      'update_debt',
      'delete_debt',
      'create_goal',
      'update_goal',
      'delete_goal',
      'create_invoice',
      'update_invoice',
      'delete_invoice',
      'create_todo',
      'update_todo',
      'delete_todo',
      'create_saving',
      'update_saving',
      'delete_saving',
      'migrate_data',
      'export_data',
    ],
  },
  entityType: {
    type: String,
    enum: ['client', 'income', 'expense', 'debt', 'goal', 'invoice', 'todo', 'saving', 'user', 'system'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
