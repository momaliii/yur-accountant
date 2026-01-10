import Ticket from '../models/Ticket.js';
import { getUserId } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { createNotification } from '../services/notification.js';

export default async function ticketRoutes(fastify, options) {
  // Get user's tickets
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { status, priority, limit = 50, skip = 0 } = request.query;

      const query = { userId };
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const tickets = await Ticket.find(query)
        .populate('assignedTo', 'email profile.name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      return {
        tickets,
        total: await Ticket.countDocuments(query),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tickets' });
    }
  });

  // Get all tickets (admin only)
  fastify.get('/all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const { status, priority, assignedTo, limit = 50, skip = 0 } = request.query;

      const query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;

      const tickets = await Ticket.find(query)
        .populate('userId', 'email profile.name')
        .populate('assignedTo', 'email profile.name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      return {
        tickets,
        total: await Ticket.countDocuments(query),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tickets' });
    }
  });

  // Get single ticket
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const ticket = await Ticket.findById(request.params.id)
        .populate('userId', 'email profile.name')
        .populate('assignedTo', 'email profile.name')
        .populate('notes.userId', 'email profile.name');

      if (!ticket) {
        return reply.code(404).send({ error: 'Ticket not found' });
      }

      // Filter internal notes for non-admins
      const user = await (await import('../models/User.js')).default.findById(userId);
      if (user?.role !== 'admin') {
        ticket.notes = ticket.notes.filter(note => !note.isInternal);
      }

      // Check access
      if (ticket.userId._id.toString() !== userId && user?.role !== 'admin') {
        return reply.code(403).send({ error: 'Access denied' });
      }

      return ticket;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch ticket' });
    }
  });

  // Create ticket
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const ticket = new Ticket({
        ...request.body,
        userId,
      });

      await ticket.save();

      // Notify admins
      const User = (await import('../models/User.js')).default;
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: 'system',
          title: 'New Support Ticket',
          message: `New ticket: ${ticket.subject}`,
          actionUrl: `/tickets/${ticket._id}`,
          priority: ticket.priority === 'urgent' ? 'urgent' : 'normal',
        });
      }

      return reply.code(201).send(ticket);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create ticket' });
    }
  });

  // Update ticket
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const ticket = await Ticket.findById(request.params.id);

      if (!ticket) {
        return reply.code(404).send({ error: 'Ticket not found' });
      }

      // Check access
      const user = await (await import('../models/User.js')).default.findById(userId);
      if (ticket.userId.toString() !== userId && user?.role !== 'admin') {
        return reply.code(403).send({ error: 'Access denied' });
      }

      Object.assign(ticket, request.body);
      await ticket.save();

      return ticket;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update ticket' });
    }
  });

  // Assign ticket (admin only)
  fastify.post('/:id/assign', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await requireAdmin(request, reply);
      const { assignedTo } = request.body;
      const ticket = await Ticket.findById(request.params.id);

      if (!ticket) {
        return reply.code(404).send({ error: 'Ticket not found' });
      }

      await ticket.assign(assignedTo);
      return ticket;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to assign ticket' });
    }
  });

  // Resolve ticket
  fastify.post('/:id/resolve', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { resolution } = request.body;
      const ticket = await Ticket.findById(request.params.id);

      if (!ticket) {
        return reply.code(404).send({ error: 'Ticket not found' });
      }

      // Check access
      const user = await (await import('../models/User.js')).default.findById(userId);
      if (ticket.userId.toString() !== userId && user?.role !== 'admin') {
        return reply.code(403).send({ error: 'Access denied' });
      }

      await ticket.resolve(resolution, userId);

      // Notify user
      await createNotification({
        userId: ticket.userId,
        type: 'success',
        title: 'Ticket Resolved',
        message: `Your ticket "${ticket.subject}" has been resolved`,
        actionUrl: `/tickets/${ticket._id}`,
      });

      return ticket;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to resolve ticket' });
    }
  });

  // Add note to ticket
  fastify.post('/:id/notes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { content, isInternal } = request.body;
      const ticket = await Ticket.findById(request.params.id);

      if (!ticket) {
        return reply.code(404).send({ error: 'Ticket not found' });
      }

      // Check access
      const user = await (await import('../models/User.js')).default.findById(userId);
      if (ticket.userId.toString() !== userId && user?.role !== 'admin') {
        return reply.code(403).send({ error: 'Access denied' });
      }

      await ticket.addNote(userId, content, isInternal || false);
      return ticket;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to add note' });
    }
  });
}
