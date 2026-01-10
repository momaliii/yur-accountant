import Expense from '../models/Expense.js';
import { getUserId } from '../middleware/auth.js';

export default async function expensesRoutes(fastify, options) {
  // Get all expenses for user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const expenses = await Expense.find({ userId })
        .sort({ date: -1 })
        .populate('clientId', 'name');
      return expenses;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch expenses' });
    }
  });

  // Get single expense
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const expense = await Expense.findOne({ _id: request.params.id, userId });
      
      if (!expense) {
        return reply.code(404).send({ error: 'Expense not found' });
      }
      
      return expense;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch expense' });
    }
  });

  // Create expense
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const expense = new Expense({
        ...request.body,
        userId,
      });
      
      await expense.save();
      return reply.code(201).send(expense);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create expense' });
    }
  });

  // Update expense
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const expense = await Expense.findOneAndUpdate(
        { _id: request.params.id, userId },
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!expense) {
        return reply.code(404).send({ error: 'Expense not found' });
      }
      
      return expense;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update expense' });
    }
  });

  // Delete expense
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const expense = await Expense.findOneAndDelete({ _id: request.params.id, userId });
      
      if (!expense) {
        return reply.code(404).send({ error: 'Expense not found' });
      }
      
      return { message: 'Expense deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete expense' });
    }
  });
}
