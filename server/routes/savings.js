import Saving from '../models/Saving.js';
import SavingsTransaction from '../models/SavingsTransaction.js';
import { getUserId } from '../middleware/auth.js';

export default async function savingsRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const savings = await Saving.find({ userId }).sort({ createdAt: -1 });
      return savings;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch savings' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const saving = await Saving.findOne({ _id: request.params.id, userId });
      if (!saving) return reply.code(404).send({ error: 'Saving not found' });
      return saving;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch saving' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const saving = new Saving({ ...request.body, userId });
      await saving.save();
      return reply.code(201).send(saving);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create saving' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const saving = await Saving.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!saving) return reply.code(404).send({ error: 'Saving not found' });
      return saving;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update saving' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      await SavingsTransaction.deleteMany({ userId, savingsId: request.params.id });
      const saving = await Saving.findOneAndDelete({ _id: request.params.id, userId });
      if (!saving) return reply.code(404).send({ error: 'Saving not found' });
      return { message: 'Saving deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete saving' });
    }
  });
}
