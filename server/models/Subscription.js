import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    required: true,
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial', 'past_due'],
    default: 'active',
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  trialEndDate: Date,
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  paymentMethod: String,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  autoRenew: {
    type: Boolean,
    default: true,
  },
  cancelledAt: Date,
  cancellationReason: String,
}, {
  timestamps: true,
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ endDate: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
  if (this.status !== 'active' && this.status !== 'trial') {
    return false;
  }
  if (this.endDate && new Date() > this.endDate) {
    return false;
  }
  return true;
};

// Check if in trial
subscriptionSchema.methods.isTrial = function () {
  return this.status === 'trial' && this.trialEndDate && new Date() < this.trialEndDate;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
