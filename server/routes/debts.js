import Debt from '../models/Debt.js';
import { getUserId } from '../middleware/auth.js';

export default async function debtsRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const debts = await Debt.find({ userId }).sort({ dueDate: 1 });
      return debts;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch debts' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const debt = await Debt.findOne({ _id: request.params.id, userId });
      if (!debt) return reply.code(404).send({ error: 'Debt not found' });
      return debt;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch debt' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const debt = new Debt({ ...request.body, userId });
      await debt.save();
      return reply.code(201).send(debt);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create debt' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const debt = await Debt.findOneAndUpdate(
        { _id: request.params.id, userId },
        request.body,
        { new: true, runValidators: true }
      );
      if (!debt) return reply.code(404).send({ error: 'Debt not found' });
      return debt;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update debt' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const debt = await Debt.findOneAndDelete({ _id: request.params.id, userId });
      if (!debt) return reply.code(404).send({ error: 'Debt not found' });
      return { message: 'Debt deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete debt' });
    }
  });
}
