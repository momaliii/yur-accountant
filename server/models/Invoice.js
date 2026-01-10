import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  price: Number,
  total: Number,
});

const invoiceSchema = new mongoose.Schema({
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
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  issueDate: {
    type: Date,
    required: true,
    index: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft',
  },
  items: [invoiceItemSchema],
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

export default mongoose.model('Invoice', invoiceSchema);
