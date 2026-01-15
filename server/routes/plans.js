import { getSupabaseClient } from '../config/supabase.js';

export default async function plansRoutes(fastify, options) {
  // Get all active plans (public endpoint)
  fastify.get('/plans', async (request, reply) => {
    try {
      fastify.log.info('Plans route hit: /api/plans');
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        fastify.log.error('Error fetching plans:', error);
        return reply.code(500).send({ error: 'Failed to fetch plans', details: error.message });
      }

      fastify.log.info(`Found ${plans?.length || 0} active plans`);
      
      if (!plans || plans.length === 0) {
        fastify.log.warn('No active plans found in database');
      }
      
      return { plans: plans || [] };
    } catch (error) {
      fastify.log.error('Error fetching plans:', error);
      return reply.code(500).send({ error: 'Failed to fetch plans', details: error.message });
    }
  });

  // Get single plan details (public endpoint)
  fastify.get('/plans/:slug', async (request, reply) => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      const { data: plan, error } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', request.params.slug)
        .eq('is_active', true)
        .single();
      
      if (error || !plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }
      
      return plan;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch plan' });
    }
  });
}
