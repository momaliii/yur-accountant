import Todo from '../models/Todo.js';
import { getUserId } from '../middleware/auth.js';

export default async function todosRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const todos = await Todo.find({ userId }).sort({ dueDate: 1 });
      return todos;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch todos' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const todo = await Todo.findOne({ _id: request.params.id, userId });
      if (!todo) return reply.code(404).send({ error: 'Todo not found' });
      return todo;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch todo' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const todo = new Todo({ ...request.body, userId });
      await todo.save();
      return reply.code(201).send(todo);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create todo' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const todo = await Todo.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!todo) return reply.code(404).send({ error: 'Todo not found' });
      return todo;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update todo' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const todo = await Todo.findOneAndDelete({ _id: request.params.id, userId });
      if (!todo) return reply.code(404).send({ error: 'Todo not found' });
      return { message: 'Todo deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete todo' });
    }
  });
}
