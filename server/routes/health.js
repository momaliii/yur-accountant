import { getSystemHealth, getAPIMetrics } from '../services/monitoring.js';

export default async function healthRoutes(fastify, options) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Detailed system health (admin only)
  fastify.get('/health/detailed', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const health = await getSystemHealth();
      return health;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get system health' });
    }
  });

  // API performance metrics (admin only)
  fastify.get('/health/metrics', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const metrics = getAPIMetrics();
      return metrics;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get API metrics' });
    }
  });

  // Database statistics (admin only) - Supabase version
  fastify.get('/health/database', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      // MongoDB removed - using Supabase now
      // Database stats for Supabase not implemented yet
      return {
        message: 'Using Supabase - database stats not available',
        provider: 'supabase',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get database stats' });
    }
  });
}
