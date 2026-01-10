import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: String,
  content: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String,
  }],
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  isAdminMessage: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
messageSchema.index({ fromUserId: 1, createdAt: -1 });
messageSchema.index({ toUserId: 1, read: 1, createdAt: -1 });
messageSchema.index({ threadId: 1 });

// Mark as read
messageSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
