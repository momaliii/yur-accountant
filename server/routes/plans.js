import Plan from '../models/Plan.js';

export default async function plansRoutes(fastify, options) {
  // Get all active plans (public endpoint)
  fastify.get('/plans', async (request, reply) => {
    try {
      fastify.log.info('Plans route hit: /api/plans');
      const plans = await Plan.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 });
      
      fastify.log.info(`Found ${plans.length} active plans`);
      
      if (plans.length === 0) {
        fastify.log.warn('No active plans found in database');
      }
      
      return { plans };
    } catch (error) {
      fastify.log.error('Error fetching plans:', error);
      return reply.code(500).send({ error: 'Failed to fetch plans', details: error.message });
    }
  });

  // Get single plan details (public endpoint)
  fastify.get('/plans/:slug', async (request, reply) => {
    try {
      const plan = await Plan.findOne({ 
        slug: request.params.slug,
        isActive: true 
      });
      
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }
      
      return plan;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch plan' });
    }
  });
}
