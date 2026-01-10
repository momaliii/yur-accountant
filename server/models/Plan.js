import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    monthly: {
      type: Number,
      default: 0,
    },
    yearly: {
      type: Number,
      default: 0,
    },
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  features: [{
    name: String,
    included: {
      type: Boolean,
      default: true,
    },
    limit: {
      type: mongoose.Schema.Types.Mixed, // Can be Number, String, or null for unlimited
      default: null,
    },
  }],
  limits: {
    clients: {
      type: Number,
      default: null, // null = unlimited
    },
    incomeEntries: {
      type: Number,
      default: null,
    },
    expenseEntries: {
      type: Number,
      default: null,
    },
    invoices: {
      type: Number,
      default: null,
    },
    storage: {
      type: Number, // in MB
      default: null,
    },
    apiCalls: {
      type: Number, // per month
      default: null,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  trialDays: {
    type: Number,
    default: 0,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
planSchema.index({ isActive: 1 });
planSchema.index({ sortOrder: 1 });

// Ensure only one default plan
planSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Plan').updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
