import mongoose from 'mongoose';

const savingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['gold', 'money', 'certificate', 'stock'],
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  initialAmount: {
    type: Number,
    default: 0,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  targetAmount: Number,
  targetDate: Date,
  interestRate: Number,
  maturityDate: Date,
  startDate: Date,
  quantity: Number,
  pricePerUnit: Number,
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

export default mongoose.model('Saving', savingSchema);
