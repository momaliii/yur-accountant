import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'feature', 'bug', 'other'],
    default: 'other',
  },
  tags: [String],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String,
  }],
  notes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    isInternal: {
      type: Boolean,
      default: false, // Internal notes only visible to admins
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  resolvedAt: Date,
  closedAt: Date,
  resolution: String,
}, {
  timestamps: true,
});

// Indexes
ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });

// Methods
ticketSchema.methods.assign = function (adminId) {
  this.assignedTo = adminId;
  this.status = 'in_progress';
  return this.save();
};

ticketSchema.methods.resolve = function (resolution, userId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolution = resolution;
  this.assignedTo = userId;
  return this.save();
};

ticketSchema.methods.close = function () {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

ticketSchema.methods.addNote = function (userId, content, isInternal = false) {
  this.notes.push({
    userId,
    content,
    isInternal,
    createdAt: new Date(),
  });
  return this.save();
};

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
