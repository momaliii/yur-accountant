import { getSupabaseClient, getSupabaseAnonClient } from '../config/supabase.js';
import { JWT_EXPIRES_IN } from '../config/jwt.js';
import { logActivity, getClientIp, getUserAgent } from '../utils/activityLogger.js';

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body;

      // Validate input
      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
      }

      if (password.length < 6) {
        return reply.code(400).send({ error: 'Password must be at least 6 characters' });
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      // Create user in Supabase Auth (using admin API with service role key)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // Auto-confirm email when using admin API
        user_metadata: {
          name: name || '',
        },
      });

      if (authError) {
        fastify.log.error('Supabase signup error:', authError);
        if (authError.message.includes('already registered')) {
          return reply.code(400).send({ error: 'User already exists' });
        }
        return reply.code(500).send({ error: 'Registration failed: ' + authError.message });
      }

      if (!authData.user) {
        return reply.code(500).send({ error: 'Registration failed: No user data returned' });
      }

      // Get user metadata from Supabase
      const userId = authData.user.id;
      const userEmail = authData.user.email;
      const userMetadata = authData.user.user_metadata || {};

      // Create subscription if plan is provided (using Supabase)
      const planSlug = request.body.planSlug;
      if (planSlug) {
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', planSlug)
          .eq('is_active', true)
          .single();

        if (plan) {
          const trialEndDate = plan.trial_days > 0
            ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
            : null;

          const subscriptionData = {
            user_id: userId,
            plan: plan.slug,
            status: plan.trial_days > 0 ? 'trial' : 'active',
            billing_cycle: request.body.billingCycle || 'monthly',
            amount: request.body.billingCycle === 'yearly' && plan.price?.yearly > 0
              ? plan.price.yearly
              : plan.price?.monthly || 0,
            currency: plan.currency || 'USD',
            trial_end_date: trialEndDate,
          };

          await supabase.from('subscriptions').insert(subscriptionData);
        }
      } else {
        // Create default free subscription
        const { data: defaultPlan } = await supabase
          .from('plans')
          .select('*')
          .or('is_default.eq.true,slug.eq.free')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (defaultPlan) {
          const subscriptionData = {
            user_id: userId,
            plan: defaultPlan.slug,
            status: 'active',
            billing_cycle: 'monthly',
            amount: 0,
            currency: defaultPlan.currency || 'USD',
          };

          await supabase.from('subscriptions').insert(subscriptionData);
        }
      }

      // Generate token (using Supabase user ID)
      const token = fastify.jwt.sign(
        { userId, email: userEmail, role: userMetadata.role || 'user' },
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: userId,
          email: userEmail,
          role: userMetadata.role || 'user',
          profile: {
            name: userMetadata.name || name || '',
          },
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      // Sign in with Supabase Auth (using anon key for signInWithPassword)
      const anonClient = getSupabaseAnonClient();
      if (!anonClient) {
        fastify.log.error('Supabase anon client not configured');
        return reply.code(500).send({ error: 'Server configuration error' });
      }
      
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        fastify.log.error('Supabase login error:', authError);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      if (!authData.user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const userId = authData.user.id;
      const userEmail = authData.user.email;
      const userMetadata = authData.user.user_metadata || {};

      // Check if user is active (check in Supabase users table if exists)
      // For now, we'll assume all users are active unless we have a users table

      // Get subscription from Supabase
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Generate token
      const token = fastify.jwt.sign(
        { userId, email: userEmail, role: userMetadata.role || 'user' },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session in Supabase (optional - can use sessions table)
      try {
        await supabase.from('sessions').insert({
          user_id: userId,
          token,
          ip_address: getClientIp(request),
          user_agent: getUserAgent(request),
          device_info: {
            platform: request.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch (error) {
        fastify.log.warn('Failed to create session:', error);
      }

      // Update last login in Supabase (if users table exists)
      try {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      } catch (error) {
        // Users table might not exist - that's okay
        fastify.log.warn('Failed to update last login:', error);
      }

      // Log login activity (non-blocking)
      logActivity({
        userId,
        action: 'login',
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      }).catch(err => {
        fastify.log.warn('Failed to log login activity:', err);
      });

      // Log security event in Supabase
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'login_success',
          resource_type: 'user',
          resource_id: userId,
          ip_address: getClientIp(request),
          user_agent: getUserAgent(request),
          severity: 'medium',
        });
      } catch (error) {
        fastify.log.warn('Failed to log security event:', error);
      }

      return {
        token,
        user: {
          id: userId,
          email: userEmail,
          role: userMetadata.role || 'user',
          profile: {
            name: userMetadata.name || '',
          },
          subscription: subscription ? {
            plan: subscription.plan,
            status: subscription.status,
          } : null,
        },
      };
    } catch (error) {
      fastify.log.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      return reply.code(500).send({ error: errorMessage });
    }
  });

  // Get current user
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId || request.user.id;
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      // Get user from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'user',
        profile: {
          name: authUser.user_metadata?.name || '',
        },
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
        } : null,
        lastLogin: authUser.last_sign_in_at,
        createdAt: authUser.created_at,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get user' });
    }
  });

  // Update current user profile
  fastify.put('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId || request.user.id;
      const { profile } = request.body;
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      // Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Update user metadata in Supabase Auth
      const updatedMetadata = {
        ...authUser.user_metadata,
        ...(profile && { name: profile.name || authUser.user_metadata?.name || '' }),
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata,
      });

      if (updateError) {
        fastify.log.error('Failed to update user metadata:', updateError);
        return reply.code(500).send({ error: 'Failed to update profile' });
      }

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: authUser.id,
        email: authUser.email,
        role: updatedMetadata.role || 'user',
        profile: {
          name: updatedMetadata.name || '',
        },
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
        } : null,
        lastLogin: authUser.last_sign_in_at,
        createdAt: authUser.created_at,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update profile' });
    }
  });

  // Refresh token (same as login for now, can be enhanced)
  fastify.post('/refresh', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId || request.user.id;
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return reply.code(500).send({ error: 'Supabase not configured' });
      }

      // Get user from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      const token = fastify.jwt.sign(
        { userId: authUser.id, email: authUser.email, role: authUser.user_metadata?.role || 'user' },
        { expiresIn: JWT_EXPIRES_IN }
      );

      return { token };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });
}
