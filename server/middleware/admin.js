// import User from '../models/User.js'; // Removed - using Supabase now
import { getSupabaseClient } from '../config/supabase.js';

export const requireAdmin = async (request, reply) => {
  try {
    // JWT should already be verified by authenticate hook
    const userId = request.user?.userId || request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      return reply.code(500).send({ error: 'Supabase not configured' });
    }
    
    // Get user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    // Check role from user metadata
    const userRole = authUser.user_metadata?.role || 'user';
    
    if (userRole !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden: Admin access required' });
    }
    
    // Attach user info to request
    request.user.role = userRole;
    request.user.userId = userId;
  } catch (error) {
    return reply.code(500).send({ error: 'Error checking admin status' });
  }
};
