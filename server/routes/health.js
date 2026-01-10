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

  // Database statistics (admin only)
  fastify.get('/health/database', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { getDBStats } = await import('../config/database.js');
      const stats = await getDBStats();
      return stats;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get database stats' });
    }
  });
}
