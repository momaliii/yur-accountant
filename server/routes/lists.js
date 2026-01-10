import List from '../models/List.js';
import Todo from '../models/Todo.js';
import { getUserId } from '../middleware/auth.js';

export default async function listsRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const lists = await List.find({ userId }).sort({ createdAt: 1 });
      return lists;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch lists' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const list = await List.findOne({ _id: request.params.id, userId });
      if (!list) return reply.code(404).send({ error: 'List not found' });
      return list;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch list' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const list = new List({ ...request.body, userId });
      await list.save();
      return reply.code(201).send(list);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create list' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const list = await List.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!list) return reply.code(404).send({ error: 'List not found' });
      return list;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update list' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const defaultList = await List.findOne({ userId, name: 'Default' });
      
      if (defaultList) {
        await Todo.updateMany(
          { userId, listId: request.params.id },
          { listId: defaultList._id }
        );
      } else {
        await Todo.deleteMany({ userId, listId: request.params.id });
      }
      
      const list = await List.findOneAndDelete({ _id: request.params.id, userId });
      if (!list) return reply.code(404).send({ error: 'List not found' });
      return { message: 'List deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete list' });
    }
  });
}
