import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  category: String,
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  },
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

export default mongoose.model('Todo', todoSchema);
