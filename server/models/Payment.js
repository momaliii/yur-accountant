import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  method: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'vodafone_cash', 'other'],
    default: 'other',
  },
  transactionId: String,
  stripePaymentIntentId: String,
  description: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  paidAt: Date,
  refundedAt: Date,
  refundAmount: Number,
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
