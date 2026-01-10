import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
  },
  profile: {
    name: String,
    company: String,
    phone: String,
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  dashboardPreferences: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // 2FA fields
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorBackupCodes: [{
    type: String,
  }],
  // Security settings
  securitySettings: {
    passwordChangeRequired: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number, // in minutes
      default: 60 * 24 * 7, // 7 days
    },
    lastPasswordChange: Date,
    passwordHistory: [{
      type: String, // hashed passwords
    }],
  },
  // GDPR compliance
  consentGiven: {
    type: Boolean,
    default: false,
  },
  consentDate: Date,
  dataRetentionSettings: {
    autoDeleteAfter: {
      type: Number, // days, null = never
      default: null,
    },
    exportFormat: {
      type: String,
      enum: ['json', 'csv'],
      default: 'json',
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
