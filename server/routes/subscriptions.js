import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';
import { getUserId } from '../middleware/auth.js';

export default async function subscriptionRoutes(fastify, options) {
  // Get user's subscription
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      let subscription = await Subscription.findOne({ userId });

      // Create default free subscription if doesn't exist
      if (!subscription) {
        subscription = new Subscription({
          userId,
          plan: 'free',
          status: 'active',
        });
        await subscription.save();
      }

      return subscription;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch subscription' });
    }
  });

  // Update subscription
  fastify.put('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const updates = request.body;

      let subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        subscription = new Subscription({
          userId,
          ...updates,
        });
      } else {
        Object.assign(subscription, updates);
      }

      await subscription.save();
      return subscription;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update subscription' });
    }
  });

  // Cancel subscription
  fastify.post('/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { reason } = request.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return reply.code(404).send({ error: 'Subscription not found' });
      }

      // Don't allow cancelling free plans
      if (subscription.plan === 'free' || subscription.amount === 0) {
        return reply.code(400).send({ error: 'Cannot cancel free plan' });
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = reason;
      subscription.autoRenew = false;

      await subscription.save();
      return subscription;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to cancel subscription' });
    }
  });

  // Reactivate subscription
  fastify.post('/reactivate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        return reply.code(404).send({ error: 'Subscription not found' });
      }

      subscription.status = 'active';
      subscription.cancelledAt = null;
      subscription.autoRenew = true;

      await subscription.save();
      return subscription;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to reactivate subscription' });
    }
  });

  // Change/Upgrade plan
  fastify.post('/change-plan', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { planSlug, billingCycle } = request.body;

      if (!planSlug) {
        return reply.code(400).send({ error: 'Plan slug is required' });
      }

      // Find the plan
      const plan = await Plan.findOne({ slug: planSlug, isActive: true });
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      // Find user's subscription
      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        // Create new subscription if doesn't exist
        subscription = new Subscription({
          userId,
          plan: plan.slug,
          status: plan.trialDays > 0 ? 'trial' : 'active',
          billingCycle: billingCycle || 'monthly',
          amount: billingCycle === 'yearly' && plan.price?.yearly > 0
            ? plan.price.yearly
            : plan.price?.monthly || 0,
          currency: plan.currency || 'USD',
          trialEndDate: plan.trialDays > 0
            ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
            : null,
          startDate: new Date(),
        });
      } else {
        // Update existing subscription
        const oldPlan = subscription.plan;
        subscription.plan = plan.slug;
        subscription.billingCycle = billingCycle || subscription.billingCycle || 'monthly';
        subscription.amount = billingCycle === 'yearly' && plan.price?.yearly > 0
          ? plan.price.yearly
          : plan.price?.monthly || 0;
        subscription.currency = plan.currency || subscription.currency || 'USD';
        
        // If upgrading from free or cancelled, reactivate
        if (subscription.status === 'cancelled' || oldPlan === 'free') {
          subscription.status = plan.trialDays > 0 ? 'trial' : 'active';
          subscription.cancelledAt = null;
          subscription.autoRenew = true;
          subscription.startDate = new Date();
        }
        
        // Set trial end date if plan has trial
        if (plan.trialDays > 0 && subscription.status !== 'trial') {
          subscription.trialEndDate = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);
          subscription.status = 'trial';
        }
      }

      await subscription.save();
      return subscription;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to change plan' });
    }
  });
}
