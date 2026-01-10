import APIKey from '../models/APIKey.js';

export async function authenticateAPIKey(request, reply) {
  try {
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return reply.code(401).send({ error: 'API key required' });
    }

    const key = await APIKey.findOne({ key: apiKey, isActive: true });

    if (!key) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    if (key.isExpired()) {
      return reply.code(401).send({ error: 'API key expired' });
    }

    // Record usage
    await key.recordUsage();

    // Attach user and permissions to request
    request.user = {
      userId: key.userId,
      apiKeyId: key._id,
      permissions: key.permissions,
    };

    return;
  } catch (error) {
    return reply.code(500).send({ error: 'Error authenticating API key' });
  }
}
