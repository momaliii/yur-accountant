import { getCache, setCache, generateCacheKey } from '../services/cache.js';

export function cacheMiddleware(ttl = 300) {
  return async (request, reply) => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return;
    }

    // Skip cache for authenticated admin routes that need fresh data
    if (request.url.includes('/admin') && request.user) {
      return;
    }

    const cacheKey = generateCacheKey(
      'api',
      request.method,
      request.url,
      request.user?.userId || 'anonymous'
    );

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      return reply.send(cached);
    }

    // Store original send function
    const originalSend = reply.send.bind(reply);

    // Override send to cache response
    reply.send = function (payload) {
      if (reply.statusCode === 200 && payload) {
        setCache(cacheKey, payload, ttl).catch(console.error);
      }
      reply.header('X-Cache', 'MISS');
      return originalSend(payload);
    };
  };
}
