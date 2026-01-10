import APIKey from '../models/APIKey.js';
import { getUserId } from '../middleware/auth.js';

export default async function apiKeyRoutes(fastify, options) {
  // Get user's API keys
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const apiKeys = await APIKey.find({ userId })
        .select('-key') // Don't return full key, only prefix
        .sort({ createdAt: -1 });

      return apiKeys;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch API keys' });
    }
  });

  // Get single API key (only on creation)
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const apiKey = await APIKey.findOne({
        _id: request.params.id,
        userId,
      }).select('-key');

      if (!apiKey) {
        return reply.code(404).send({ error: 'API key not found' });
      }

      return apiKey;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch API key' });
    }
  });

  // Create API key
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { name, permissions, expiresAt } = request.body;

      if (!name) {
        return reply.code(400).send({ error: 'name is required' });
      }

      const key = APIKey.generateKey();
      const apiKey = new APIKey({
        userId,
        name,
        key,
        keyPrefix: key.substring(0, 12) + '...',
        permissions: permissions || ['read:all'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      await apiKey.save();

      // Return full key only once
      return {
        ...apiKey.toObject(),
        key, // Include full key only on creation
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create API key' });
    }
  });

  // Update API key
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const apiKey = await APIKey.findOne({
        _id: request.params.id,
        userId,
      });

      if (!apiKey) {
        return reply.code(404).send({ error: 'API key not found' });
      }

      const { name, permissions, isActive, expiresAt } = request.body;
      if (name) apiKey.name = name;
      if (permissions) apiKey.permissions = permissions;
      if (typeof isActive === 'boolean') apiKey.isActive = isActive;
      if (expiresAt) apiKey.expiresAt = new Date(expiresAt);

      await apiKey.save();
      return apiKey.toObject();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update API key' });
    }
  });

  // Delete API key
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const apiKey = await APIKey.findOneAndDelete({
        _id: request.params.id,
        userId,
      });

      if (!apiKey) {
        return reply.code(404).send({ error: 'API key not found' });
      }

      return { message: 'API key deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete API key' });
    }
  });
}
