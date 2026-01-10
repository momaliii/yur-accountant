import mongoose from 'mongoose';
import crypto from 'crypto';

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  secret: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex'),
  },
  events: [{
    type: String,
    enum: [
      'user.created',
      'user.updated',
      'client.created',
      'client.updated',
      'client.deleted',
      'income.created',
      'income.updated',
      'expense.created',
      'expense.updated',
      'payment.completed',
      'payment.failed',
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
    ],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastTriggered: Date,
  successCount: {
    type: Number,
    default: 0,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
webhookSchema.index({ userId: 1, isActive: 1 });

// Generate signature for webhook payload
webhookSchema.methods.generateSignature = function (payload) {
  const hmac = crypto.createHmac('sha256', this.secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
};

const Webhook = mongoose.model('Webhook', webhookSchema);

export default Webhook;
