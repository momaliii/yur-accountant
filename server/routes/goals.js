import Goal from '../models/Goal.js';
import { getUserId } from '../middleware/auth.js';

export default async function goalsRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
      return goals;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch goals' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const goal = await Goal.findOne({ _id: request.params.id, userId });
      if (!goal) return reply.code(404).send({ error: 'Goal not found' });
      return goal;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch goal' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const goal = new Goal({ ...request.body, userId, currentAmount: 0 });
      await goal.save();
      return reply.code(201).send(goal);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create goal' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const goal = await Goal.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!goal) return reply.code(404).send({ error: 'Goal not found' });
      return goal;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update goal' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const goal = await Goal.findOneAndDelete({ _id: request.params.id, userId });
      if (!goal) return reply.code(404).send({ error: 'Goal not found' });
      return { message: 'Goal deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete goal' });
    }
  });
}
