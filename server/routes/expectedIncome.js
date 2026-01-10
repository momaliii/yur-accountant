import ExpectedIncome from '../models/ExpectedIncome.js';
import { getUserId } from '../middleware/auth.js';

export default async function expectedIncomeRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const expectedIncome = await ExpectedIncome.find({ userId })
        .sort({ period: -1 })
        .populate('clientId', 'name');
      return expectedIncome;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch expected income' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const expectedIncome = await ExpectedIncome.findOne({ _id: request.params.id, userId });
      if (!expectedIncome) return reply.code(404).send({ error: 'Expected income not found' });
      return expectedIncome;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch expected income' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      // Use upsert logic
      const existing = await ExpectedIncome.findOne({
        userId,
        clientId: request.body.clientId,
        period: request.body.period,
      });
      
      let expectedIncome;
      if (existing) {
        expectedIncome = await ExpectedIncome.findOneAndUpdate(
          { _id: existing._id, userId },
          { ...request.body, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      } else {
        expectedIncome = new ExpectedIncome({ ...request.body, userId });
        await expectedIncome.save();
      }
      
      return reply.code(201).send(expectedIncome);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create expected income' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const expectedIncome = await ExpectedIncome.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!expectedIncome) return reply.code(404).send({ error: 'Expected income not found' });
      return expectedIncome;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update expected income' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const expectedIncome = await ExpectedIncome.findOneAndDelete({ _id: request.params.id, userId });
      if (!expectedIncome) return reply.code(404).send({ error: 'Expected income not found' });
      return { message: 'Expected income deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete expected income' });
    }
  });
}
