import Invoice from '../models/Invoice.js';
import { getUserId } from '../middleware/auth.js';

export default async function invoicesRoutes(fastify, options) {
  const getUserIdFromRequest = (request) => request.user?.userId || request.user?.id;

  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const invoices = await Invoice.find({ userId })
        .sort({ issueDate: -1 })
        .populate('clientId', 'name');
      return invoices;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch invoices' });
    }
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const invoice = await Invoice.findOne({ _id: request.params.id, userId })
        .populate('clientId');
      if (!invoice) return reply.code(404).send({ error: 'Invoice not found' });
      return invoice;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch invoice' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      
      // Generate invoice number if not provided
      if (!request.body.invoiceNumber) {
        const lastInvoice = await Invoice.findOne({ userId })
          .sort({ invoiceNumber: -1 });
        let nextNum = 1;
        if (lastInvoice?.invoiceNumber) {
          const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }
        request.body.invoiceNumber = `INV-${String(nextNum).padStart(3, '0')}`;
      }
      
      const invoice = new Invoice({ ...request.body, userId });
      await invoice.save();
      return reply.code(201).send(invoice);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create invoice' });
    }
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const invoice = await Invoice.findOneAndUpdate(
        { _id: request.params.id, userId },
        { ...request.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!invoice) return reply.code(404).send({ error: 'Invoice not found' });
      return invoice;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update invoice' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserIdFromRequest(request);
      const invoice = await Invoice.findOneAndDelete({ _id: request.params.id, userId });
      if (!invoice) return reply.code(404).send({ error: 'Invoice not found' });
      return { message: 'Invoice deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete invoice' });
    }
  });
}
