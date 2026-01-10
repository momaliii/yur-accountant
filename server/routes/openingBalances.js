import OpeningBalance from '../models/OpeningBalance.js';
import { getUserId } from '../middleware/auth.js';

export default async function openingBalancesRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const balances = await OpeningBalance.find({ userId }).sort({ period: -1 });
      return balances;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch opening balances' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const balance = await OpeningBalance.findOne({ _id: request.params.id, userId });
      if (!balance) return reply.code(404).send({ error: 'Opening balance not found' });
      return balance;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch opening balance' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      // Use upsert logic
      const existing = await OpeningBalance.findOne({
        userId,
        periodType: request.body.periodType,
        period: request.body.period,
      });
      
      let balance;
      if (existing) {
        balance = await OpeningBalance.findOneAndUpdate(
          { _id: existing._id, userId },
          { ...request.body, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      } else {
        balance = new OpeningBalance({ ...request.body, userId });
        await balance.save();
      }
      
      return reply.code(201).send(balance);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create opening balance' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const balance = await OpeningBalance.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!balance) return reply.code(404).send({ error: 'Opening balance not found' });
      return balance;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update opening balance' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const balance = await OpeningBalance.findOneAndDelete({ _id: request.params.id, userId });
      if (!balance) return reply.code(404).send({ error: 'Opening balance not found' });
      return { message: 'Opening balance deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete opening balance' });
    }
  });
}
