import Payment from '../models/Payment.js';
import { getUserId } from '../middleware/auth.js';

export default async function paymentRoutes(fastify, options) {
  // Get user's payments
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { limit = 50, skip = 0 } = request.query;

      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Payment.countDocuments({ userId });

      return {
        payments,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch payments' });
    }
  });

  // Get single payment
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const payment = await Payment.findOne({
        _id: request.params.id,
        userId,
      });

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found' });
      }

      return payment;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch payment' });
    }
  });

  // Create payment (for manual entry or after Stripe processing)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const payment = new Payment({
        ...request.body,
        userId,
      });

      await payment.save();
      return reply.code(201).send(payment);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create payment' });
    }
  });
}
