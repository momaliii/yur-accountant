import Announcement from '../models/Announcement.js';
import { getUserId } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { broadcastNotification } from '../services/realtime.js';

export default async function announcementRoutes(fastify, options) {
  // Get active announcements for current user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const user = await (await import('../models/User.js')).default.findById(userId);

      const announcements = await Announcement.find({ isActive: true })
        .populate('createdBy', 'email profile.name')
        .sort({ priority: -1, createdAt: -1 });

      // Filter announcements for this user
      const userAnnouncements = announcements.filter(announcement =>
        announcement.shouldShowToUser(userId, user?.role)
      );

      return userAnnouncements;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch announcements' });
    }
  });

  // Get all announcements (admin only)
  fastify.get('/all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const announcements = await Announcement.find()
        .populate('createdBy', 'email profile.name')
        .sort({ createdAt: -1 });

      return announcements;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch announcements' });
    }
  });

  // Get single announcement
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const announcement = await Announcement.findById(request.params.id)
        .populate('createdBy', 'email profile.name');

      if (!announcement) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }

      // Record view
      await announcement.recordView(userId);

      return announcement;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch announcement' });
    }
  });

  // Create announcement (admin only)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const userId = getUserId(request);
      const announcement = new Announcement({
        ...request.body,
        createdBy: userId,
      });

      await announcement.save();

      // Broadcast to all users if target is 'all'
      if (announcement.targetAudience === 'all') {
        broadcastNotification({
          type: 'announcement',
          title: announcement.title,
          message: announcement.content,
          priority: announcement.priority,
        });
      }

      return reply.code(201).send(announcement);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create announcement' });
    }
  });

  // Update announcement (admin only)
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const announcement = await Announcement.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true, runValidators: true }
      );

      if (!announcement) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }

      return announcement;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update announcement' });
    }
  });

  // Delete announcement (admin only)
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const announcement = await Announcement.findByIdAndDelete(request.params.id);

      if (!announcement) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }

      return { message: 'Announcement deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete announcement' });
    }
  });
}
