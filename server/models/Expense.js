import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: [
      'subscriptions',
      'fees',
      'tools',
      'salaries',
      'outsourcing',
      'advertising',
      'office_supplies',
      'travel',
      'rent',
      'utilities',
      'internet_phone',
      'transportation',
      'other',
    ],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  description: String,
  isRecurring: {
    type: Boolean,
    default: false,
  },
  parentRecurringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
  },
  taxCategory: String,
  isTaxDeductible: {
    type: Boolean,
    default: false,
  },
  taxRate: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Expense', expenseSchema);
