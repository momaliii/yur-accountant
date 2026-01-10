import Income from '../models/Income.js';
import { getUserId } from '../middleware/auth.js';

export default async function incomeRoutes(fastify, options) {
  // Get all income for user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const income = await Income.find({ userId })
        .sort({ receivedDate: -1 })
        .populate('clientId', 'name');
      return income;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch income' });
    }
  });

  // Get single income
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const income = await Income.findOne({ _id: request.params.id, userId });
      
      if (!income) {
        return reply.code(404).send({ error: 'Income not found' });
      }
      
      return income;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch income' });
    }
  });

  // Create income
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const income = new Income({
        ...request.body,
        userId,
      });
      
      await income.save();
      return reply.code(201).send(income);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create income' });
    }
  });

  // Update income
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const income = await Income.findOneAndUpdate(
        { _id: request.params.id, userId },
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!income) {
        return reply.code(404).send({ error: 'Income not found' });
      }
      
      return income;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update income' });
    }
  });

  // Delete income
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const income = await Income.findOneAndDelete({ _id: request.params.id, userId });
      
      if (!income) {
        return reply.code(404).send({ error: 'Income not found' });
      }
      
      return { message: 'Income deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete income' });
    }
  });
}
