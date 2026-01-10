import SavingsTransaction from '../models/SavingsTransaction.js';
import Saving from '../models/Saving.js';
import { getUserId } from '../middleware/auth.js';

export default async function savingsTransactionsRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const transactions = await SavingsTransaction.find({ userId })
        .sort({ date: -1 })
        .populate('savingsId', 'name');
      return transactions;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch transactions' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const transaction = await SavingsTransaction.findOne({ _id: request.params.id, userId });
      if (!transaction) return reply.code(404).send({ error: 'Transaction not found' });
      return transaction;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch transaction' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const transaction = new SavingsTransaction({ ...request.body, userId });
      await transaction.save();
      
      // Update saving amount
      const saving = await Saving.findOne({ _id: request.body.savingsId, userId });
      if (saving) {
        let newAmount = saving.currentAmount || saving.initialAmount || 0;
        if (transaction.type === 'deposit') {
          newAmount += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          newAmount -= transaction.amount;
        } else if (transaction.type === 'value_update') {
          if (transaction.quantity && transaction.pricePerUnit) {
            newAmount = transaction.quantity * transaction.pricePerUnit;
          } else {
            newAmount = transaction.amount;
          }
        }
        saving.currentAmount = newAmount;
        if (transaction.pricePerUnit) saving.pricePerUnit = transaction.pricePerUnit;
        if (transaction.quantity) saving.quantity = transaction.quantity;
        await saving.save();
      }
      
      return reply.code(201).send(transaction);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create transaction' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const transaction = await SavingsTransaction.findOneAndUpdate(
        { _id: request.params.id, userId },
        request.body,
        { new: true, runValidators: true }
      );
      if (!transaction) return reply.code(404).send({ error: 'Transaction not found' });
      
      // Recalculate saving amount
      const saving = await Saving.findOne({ _id: transaction.savingsId, userId });
      if (saving) {
        const allTransactions = await SavingsTransaction.find({ userId, savingsId: saving._id });
        let newAmount = saving.initialAmount || 0;
        allTransactions.forEach((t) => {
          if (t.type === 'deposit') {
            newAmount += t.amount;
          } else if (t.type === 'withdrawal') {
            newAmount -= t.amount;
          } else if (t.type === 'value_update') {
            if (t.quantity && t.pricePerUnit) {
              newAmount = t.quantity * t.pricePerUnit;
            } else {
              newAmount = t.amount;
            }
          }
        });
        saving.currentAmount = newAmount;
        await saving.save();
      }
      
      return transaction;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update transaction' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const transaction = await SavingsTransaction.findOne({ _id: request.params.id, userId });
      if (!transaction) return reply.code(404).send({ error: 'Transaction not found' });
      
      await SavingsTransaction.findByIdAndDelete(request.params.id);
      
      // Recalculate saving amount
      const saving = await Saving.findOne({ _id: transaction.savingsId, userId });
      if (saving) {
        const allTransactions = await SavingsTransaction.find({ userId, savingsId: saving._id });
        let newAmount = saving.initialAmount || 0;
        allTransactions.forEach((t) => {
          if (t.type === 'deposit') {
            newAmount += t.amount;
          } else if (t.type === 'withdrawal') {
            newAmount -= t.amount;
          } else if (t.type === 'value_update') {
            if (t.quantity && t.pricePerUnit) {
              newAmount = t.quantity * t.pricePerUnit;
            } else {
              newAmount = t.amount;
            }
          }
        });
        saving.currentAmount = newAmount;
        await saving.save();
      }
      
      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete transaction' });
    }
  });
}
