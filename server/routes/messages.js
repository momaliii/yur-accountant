import Message from '../models/Message.js';
import User from '../models/User.js';
import { getUserId } from '../middleware/auth.js';
import { sendNotificationToUser } from '../services/realtime.js';
import { createNotification } from '../services/notification.js';

export default async function messageRoutes(fastify, options) {
  // Get user's messages (inbox)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { limit = 50, skip = 0, unreadOnly } = request.query;

      const query = { toUserId: userId };
      if (unreadOnly === 'true') {
        query.read = false;
      }

      const messages = await Message.find(query)
        .populate('fromUserId', 'email profile.name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const unreadCount = await Message.countDocuments({
        toUserId: userId,
        read: false,
      });

      return {
        messages,
        unreadCount,
        total: await Message.countDocuments({ toUserId: userId }),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch messages' });
    }
  });

  // Get sent messages
  fastify.get('/sent', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { limit = 50, skip = 0 } = request.query;

      const messages = await Message.find({ fromUserId: userId })
        .populate('toUserId', 'email profile.name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      return {
        messages,
        total: await Message.countDocuments({ fromUserId: userId }),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch sent messages' });
    }
  });

  // Get message thread
  fastify.get('/thread/:threadId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const threadId = request.params.threadId;

      const messages = await Message.find({
        $or: [
          { threadId },
          { _id: threadId },
        ],
        $or: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      })
        .populate('fromUserId', 'email profile.name')
        .populate('toUserId', 'email profile.name')
        .sort({ createdAt: 1 });

      return messages;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch thread' });
    }
  });

  // Send message
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const fromUserId = getUserId(request);
      const { toUserId, subject, content, threadId, attachments } = request.body;

      if (!toUserId || !content) {
        return reply.code(400).send({ error: 'toUserId and content are required' });
      }

      // Check if user is admin (for admin-to-user messages)
      const fromUser = await User.findById(fromUserId);
      const isAdminMessage = fromUser?.role === 'admin';

      const message = new Message({
        fromUserId,
        toUserId,
        subject,
        content,
        threadId,
        attachments: attachments || [],
        isAdminMessage,
      });

      await message.save();

      // Send real-time notification
      sendNotificationToUser(toUserId, {
        type: 'message',
        title: subject || 'New Message',
        message: content.substring(0, 100),
        from: fromUser?.email,
      });

      // Create notification
      await createNotification({
        userId: toUserId,
        type: 'user_action',
        title: subject || 'New Message',
        message: `You have a new message from ${fromUser?.profile?.name || fromUser?.email}`,
        actionUrl: '/messages',
        priority: 'normal',
      });

      return reply.code(201).send(message);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to send message' });
    }
  });

  // Mark message as read
  fastify.put('/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const message = await Message.findOne({
        _id: request.params.id,
        toUserId: userId,
      });

      if (!message) {
        return reply.code(404).send({ error: 'Message not found' });
      }

      message.read = true;
      message.readAt = new Date();
      await message.save();

      return message;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to mark message as read' });
    }
  });

  // Delete message
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const message = await Message.findOne({
        _id: request.params.id,
        $or: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      });

      if (!message) {
        return reply.code(404).send({ error: 'Message not found' });
      }

      await message.deleteOne();
      return { message: 'Message deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete message' });
    }
  });
}
