import mongoose from 'mongoose';

const savingsTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  savingsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Saving',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'value_update'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  pricePerUnit: Number,
  quantity: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('SavingsTransaction', savingsTransactionSchema);
