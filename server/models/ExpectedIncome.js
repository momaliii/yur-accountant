import mongoose from 'mongoose';

const expectedIncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  },
  period: {
    type: String,
    required: true,
    index: true,
  },
  expectedAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  notes: String,
  isPaid: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for unique client+period per user
expectedIncomeSchema.index({ userId: 1, clientId: 1, period: 1 }, { unique: true });

export default mongoose.model('ExpectedIncome', expectedIncomeSchema);
