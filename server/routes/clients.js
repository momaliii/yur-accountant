import Client from '../models/Client.js';
import { getUserId } from '../middleware/auth.js';
import { logActivity, getClientIp, getUserAgent } from '../utils/activityLogger.js';

export default async function clientsRoutes(fastify, options) {
  // Get all clients for user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const clients = await Client.find({ userId }).sort({ createdAt: -1 });
      return clients;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch clients' });
    }
  });

  // Get single client
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const client = await Client.findOne({ _id: request.params.id, userId });
      
      if (!client) {
        return reply.code(404).send({ error: 'Client not found' });
      }
      
      return client;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch client' });
    }
  });

  // Create client
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const client = new Client({
        ...request.body,
        userId,
      });
      
      await client.save();
      
      // Log activity
      await logActivity({
        userId,
        action: 'create_client',
        entityType: 'client',
        entityId: client._id,
        details: { name: client.name },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return reply.code(201).send(client);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create client' });
    }
  });

  // Update client
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const client = await Client.findOneAndUpdate(
        { _id: request.params.id, userId },
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!client) {
        return reply.code(404).send({ error: 'Client not found' });
      }
      
      // Log activity
      await logActivity({
        userId,
        action: 'update_client',
        entityType: 'client',
        entityId: client._id,
        details: { name: client.name },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return client;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update client' });
    }
  });

  // Delete client
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const client = await Client.findOneAndDelete({ _id: request.params.id, userId });
      
      if (!client) {
        return reply.code(404).send({ error: 'Client not found' });
      }
      
      // Log activity
      await logActivity({
        userId,
        action: 'delete_client',
        entityType: 'client',
        entityId: client._id,
        details: { name: client.name },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
      
      return { message: 'Client deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete client' });
    }
  });
}
