let redis = null;
let redisClient = null;
let useMemoryCache = true;
const memoryCache = new Map();
const CACHE_TTL = 3600; // 1 hour default

// Initialize Redis client
export async function initCache() {
  // Try to import redis, but don't fail if it's not installed
  try {
    redis = await import('redis');
  } catch (error) {
    console.log('Redis package not found, using in-memory cache');
    useMemoryCache = true;
    return;
  }

  if (!process.env.REDIS_URL) {
    console.log('Using in-memory cache (Redis not configured)');
    useMemoryCache = true;
    return;
  }

  useMemoryCache = false;

  try {
    redisClient = redis.default.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      // Fallback to memory cache on error
      useMemoryCache = true;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis, using memory cache:', error.message);
    useMemoryCache = true;
  }
}

// Get cached value
export async function getCache(key) {
  try {
    if (useMemoryCache || !redisClient) {
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      if (cached) {
        memoryCache.delete(key);
      }
      return null;
    }

    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Set cached value
export async function setCache(key, value, ttl = CACHE_TTL) {
  try {
    if (useMemoryCache || !redisClient) {
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
      });
      return;
    }

    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

// Delete cached value
export async function deleteCache(key) {
  try {
    if (useMemoryCache || !redisClient) {
      memoryCache.delete(key);
      return;
    }

    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

// Clear cache by pattern
export async function clearCachePattern(pattern) {
  try {
    if (useMemoryCache || !redisClient) {
      // Clear all matching keys from memory cache
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      }
      return;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache clear pattern error:', error);
  }
}

// Generate cache key
export function generateCacheKey(prefix, ...params) {
  return `${prefix}:${params.join(':')}`;
}

// Cache middleware for Fastify
export function cacheMiddleware(ttl = CACHE_TTL) {
  return async (request, reply) => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return;
    }

    const cacheKey = generateCacheKey(
      'api',
      request.url,
      request.user?.userId || 'anonymous'
    );

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    // Store original send function
    const originalSend = reply.send.bind(reply);

    // Override send to cache response
    reply.send = function (payload) {
      if (reply.statusCode === 200) {
        setCache(cacheKey, payload, ttl).catch(console.error);
      }
      return originalSend(payload);
    };
  };
}

// Close Redis connection
export async function closeCache() {
  if (redisClient) {
    await redisClient.quit();
  }
}
