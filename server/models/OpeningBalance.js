import mongoose from 'mongoose';

const openingBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  periodType: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  period: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  notes: String,
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

// Compound index for unique period per user
openingBalanceSchema.index({ userId: 1, periodType: 1, period: 1 }, { unique: true });

export default mongoose.model('OpeningBalance', openingBalanceSchema);
