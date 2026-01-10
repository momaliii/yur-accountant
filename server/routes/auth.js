import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';
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

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
        profile: {
          name: name || '',
        },
      });

      await user.save();

      // Create subscription if plan is provided
      const planSlug = request.body.planSlug;
      if (planSlug) {
        const plan = await Plan.findOne({ slug: planSlug, isActive: true });
        if (plan) {
          const trialEndDate = plan.trialDays > 0
            ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
            : null;

          const subscription = new Subscription({
            userId: user._id,
            plan: plan.slug,
            status: plan.trialDays > 0 ? 'trial' : 'active',
            billingCycle: request.body.billingCycle || 'monthly',
            amount: request.body.billingCycle === 'yearly' && plan.price?.yearly > 0
              ? plan.price.yearly
              : plan.price?.monthly || 0,
            currency: plan.currency || 'USD',
            trialEndDate,
          });

          await subscription.save();
        }
      } else {
        // Create default free subscription
        const defaultPlan = await Plan.findOne({ isDefault: true, isActive: true }) || 
                           await Plan.findOne({ slug: 'free', isActive: true });
        
        if (defaultPlan) {
          const subscription = new Subscription({
            userId: user._id,
            plan: defaultPlan.slug,
            status: 'active',
            billingCycle: 'monthly',
            amount: 0,
            currency: defaultPlan.currency || 'USD',
          });
          await subscription.save();
        }
      }

      // Generate token
      const token = fastify.jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
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

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.code(403).send({ error: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // 2FA has been removed - skip 2FA verification

      // Generate token
      const token = fastify.jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session
      try {
        const Session = (await import('../models/Session.js')).default;
        const session = new Session({
          userId: user._id,
          token,
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          deviceInfo: {
            platform: request.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        await session.save();
      } catch (error) {
        fastify.log.warn('Failed to create session:', error);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Log login activity (non-blocking - don't fail login if logging fails)
      logActivity({
        userId: user._id,
        action: 'login',
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      }).catch(err => {
        fastify.log.warn('Failed to log login activity:', err);
      });

      // Log security event
      try {
        const AuditLog = (await import('../models/AuditLog.js')).default;
        new AuditLog({
          userId: user._id,
          action: 'login_success',
          resourceType: 'user',
          resourceId: user._id.toString(),
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          severity: 'medium',
        }).save().catch(() => {});
      } catch (error) {
        fastify.log.warn('Failed to log security event:', error);
      }

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          subscription: user.subscription,
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
      const user = await User.findById(userId);
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        subscription: user.subscription,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
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

      const user = await User.findById(userId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Update profile fields
      if (profile) {
        user.profile = {
          ...user.profile,
          ...profile,
        };
      }

      await user.save();

      return {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        subscription: user.subscription,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
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
      const user = await User.findById(userId);
      
      if (!user || !user.isActive) {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      const token = fastify.jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        { expiresIn: JWT_EXPIRES_IN }
      );

      return { token };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });
}
