import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
  email: String,
  phone: String,
  paymentModel: {
    type: String,
    enum: ['fixed', 'fixed_plus_percent', 'percent_only', 'commission', 'per_project'],
    default: 'fixed',
  },
  fixedAmount: Number,
  adSpendPercentage: Number,
  subcontractorCost: Number,
  currency: {
    type: String,
    default: 'EGP',
  },
  services: [{
    type: String,
    enum: ['fb_ads', 'google_ads', 'tiktok_ads', 'strategy', 'creative'],
  }],
  notes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'hold', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Client', clientSchema);
