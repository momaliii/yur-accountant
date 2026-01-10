import Webhook from '../models/Webhook.js';
import { getUserId } from '../middleware/auth.js';

export default async function webhookRoutes(fastify, options) {
  // Get user's webhooks
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const webhooks = await Webhook.find({ userId }).sort({ createdAt: -1 });
      return webhooks;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch webhooks' });
    }
  });

  // Get single webhook
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const webhook = await Webhook.findOne({
        _id: request.params.id,
        userId,
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      return webhook;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch webhook' });
    }
  });

  // Create webhook
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { url, events } = request.body;

      if (!url || !events || events.length === 0) {
        return reply.code(400).send({ error: 'url and events are required' });
      }

      const webhook = new Webhook({
        userId,
        url,
        events,
      });

      await webhook.save();
      return reply.code(201).send(webhook);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create webhook' });
    }
  });

  // Update webhook
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const webhook = await Webhook.findOne({
        _id: request.params.id,
        userId,
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      Object.assign(webhook, request.body);
      await webhook.save();

      return webhook;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update webhook' });
    }
  });

  // Delete webhook
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const webhook = await Webhook.findOneAndDelete({
        _id: request.params.id,
        userId,
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      return { message: 'Webhook deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete webhook' });
    }
  });

  // Test webhook
  fastify.post('/:id/test', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const webhook = await Webhook.findOne({
        _id: request.params.id,
        userId,
      });

      if (!webhook) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      const { triggerWebhooks } = await import('../services/webhook.js');
      const results = await triggerWebhooks('test', { test: true });

      return { message: 'Test webhook triggered', results };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to test webhook' });
    }
  });
}
