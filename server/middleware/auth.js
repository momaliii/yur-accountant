export const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify();
    
    // Validate session if token is present
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const Session = (await import('../models/Session.js')).default;
        const session = await Session.findOne({
          token,
          isActive: true,
          expiresAt: { $gt: new Date() },
        });
        
        if (!session) {
          return reply.code(401).send({ error: 'Session expired or invalid' });
        }
        
        // Update last activity
        session.updateActivity().catch(() => {});
      } catch (error) {
        // If session check fails, still allow (for backward compatibility)
        console.warn('Session validation error:', error);
      }
    }
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

export const getUserId = (request) => {
  return request.user?.userId || request.user?.id;
};
