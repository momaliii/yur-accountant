import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
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
  paymentMethod: {
    type: String,
    enum: ['vodafone_cash', 'bank_transfer', 'instapay', 'cash', 'other'],
    required: true,
  },
  receivedDate: {
    type: Date,
    required: true,
    index: true,
  },
  isDeposit: {
    type: Boolean,
    default: false,
  },
  isFixedPortionOnly: {
    type: Boolean,
    default: false,
  },
  taxCategory: String,
  isTaxable: {
    type: Boolean,
    default: true,
  },
  taxRate: Number,
  netAmount: Number,
  fee: Number,
  adSpend: Number,
  projectName: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Income', incomeSchema);
