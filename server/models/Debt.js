import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['owed_to_me', 'i_owe'],
    required: true,
  },
  partyName: {
    type: String,
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
  dueDate: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Debt', debtSchema);
