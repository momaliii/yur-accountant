import { getUserId } from '../middleware/auth.js';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '../services/notification.js';

export default async function notificationRoutes(fastify, options) {
  // Get user notifications
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { limit = 50, skip = 0, unreadOnly, type } = request.query;

      const result = await getUserNotifications(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true',
        type: type || null,
      });

      return result;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // Get unread count
  fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { getUserNotifications } = await import('../services/notification.js');
      const result = await getUserNotifications(userId, { limit: 1, unreadOnly: true });
      
      return { count: result.unreadCount };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get unread count' });
    }
  });

  // Mark notification as read
  fastify.put('/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const notification = await markAsRead(request.params.id, userId);
      return notification;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(404).send({ error: 'Notification not found' });
    }
  });

  // Mark all as read
  fastify.put('/read-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const result = await markAllAsRead(userId);
      return { message: 'All notifications marked as read', modified: result.modifiedCount };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to mark all as read' });
    }
  });

  // Delete notification
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const notification = await deleteNotification(request.params.id, userId);
      
      if (!notification) {
        return reply.code(404).send({ error: 'Notification not found' });
      }

      return { message: 'Notification deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete notification' });
    }
  });

  // Delete all read notifications
  fastify.delete('/read/all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const result = await deleteReadNotifications(userId);
      return { message: 'Read notifications deleted', deleted: result.deletedCount };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete read notifications' });
    }
  });
}
