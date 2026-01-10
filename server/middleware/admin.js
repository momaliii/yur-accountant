import User from '../models/User.js';

export const requireAdmin = async (request, reply) => {
  try {
    // JWT should already be verified by authenticate hook
    const userId = request.user?.userId || request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden: Admin access required' });
    }
    
    // Attach user info to request
    request.user.role = user.role;
    request.user.userId = user._id;
  } catch (error) {
    return reply.code(500).send({ error: 'Error checking admin status' });
  }
};
