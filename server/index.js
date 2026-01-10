import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { initCache } from './services/cache.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import clientsRoutes from './routes/clients.js';
import incomeRoutes from './routes/income.js';
import expensesRoutes from './routes/expenses.js';
import debtsRoutes from './routes/debts.js';
import goalsRoutes from './routes/goals.js';
import invoicesRoutes from './routes/invoices.js';
import todosRoutes from './routes/todos.js';
import listsRoutes from './routes/lists.js';
import savingsRoutes from './routes/savings.js';
import savingsTransactionsRoutes from './routes/savingsTransactions.js';
import openingBalancesRoutes from './routes/openingBalances.js';
import expectedIncomeRoutes from './routes/expectedIncome.js';
import migrationRoutes from './routes/migration.js';
import healthRoutes from './routes/health.js';
import notificationRoutes from './routes/notifications.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import messageRoutes from './routes/messages.js';
import ticketRoutes from './routes/tickets.js';
import announcementRoutes from './routes/announcements.js';
import webhookRoutes from './routes/webhooks.js';
import apiKeyRoutes from './routes/apiKeys.js';
import docsRoutes from './routes/docs.js';
import plansRoutes from './routes/plans.js';
import dashboardRoutes from './routes/dashboard.js';
import appUpdatesRoutes from './routes/appUpdates.js';
import securityRoutes from './routes/security.js';
import aiRoutes from './routes/ai.js';
import { performanceMonitoring, performanceMonitoringResponse } from './services/monitoring.js';
import { initializeRealtime, sendNotificationToUser } from './services/realtime.js';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
});

// Add authenticate decorator
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
    // If verification succeeds, request.user will be set with the decoded token
    if (!request.user) {
      reply.code(401).send({ error: 'Invalid authentication token' });
      return;
    }
  } catch (err) {
    // JWT errors can be 400 (bad format) or 401 (expired/invalid)
    const statusCode = err.statusCode === 400 ? 401 : (err.statusCode || 401);
    const errorMessage = err.message || 'Unauthorized';
    fastify.log.warn('Authentication failed', { 
      statusCode, 
      message: errorMessage,
      hasToken: !!request.headers.authorization 
    });
    reply.code(statusCode).send({ error: errorMessage });
    return;
  }
});

// Connect to MongoDB
await connectDB();

// Initialize default plans if none exist
const initDefaultPlans = async () => {
  try {
    const Plan = (await import('./models/Plan.js')).default;
    const planCount = await Plan.countDocuments();
    
    if (planCount === 0) {
      fastify.log.info('Initializing default plans...');
      
      // Free Plan
      const freePlan = new Plan({
        name: 'Free',
        slug: 'free',
        description: 'Perfect for getting started. Basic features with limited usage.',
        price: {
          monthly: 0,
          yearly: 0,
        },
        currency: 'USD',
        features: [
          { name: 'Basic Dashboard', included: true },
          { name: 'Client Management', included: true, limit: 5 },
          { name: 'Income Tracking', included: true, limit: 50 },
          { name: 'Expense Tracking', included: true, limit: 50 },
          { name: 'Basic Reports', included: true },
        ],
        limits: {
          clients: 5,
          incomeEntries: 50,
          expenseEntries: 50,
          invoices: 10,
          storage: 100, // 100 MB
          apiCalls: 1000, // per month
        },
        isActive: true,
        isDefault: true,
        trialDays: 0,
        sortOrder: 1,
      });

      // Basic Plan ($5/month)
      const basicPlan = new Plan({
        name: 'Basic',
        slug: 'basic',
        description: 'For growing businesses. More features and higher limits.',
        price: {
          monthly: 5,
          yearly: 50, // $50/year (2 months free)
        },
        currency: 'USD',
        features: [
          { name: 'Full Dashboard', included: true },
          { name: 'Unlimited Clients', included: true },
          { name: 'Unlimited Income Tracking', included: true },
          { name: 'Unlimited Expense Tracking', included: true },
          { name: 'Advanced Reports', included: true },
          { name: 'Invoice Management', included: true },
          { name: 'Goal Tracking', included: true },
          { name: 'Savings Management', included: true },
          { name: 'Priority Support', included: true },
        ],
        limits: {
          clients: null, // Unlimited
          incomeEntries: null, // Unlimited
          expenseEntries: null, // Unlimited
          invoices: null, // Unlimited
          storage: 1000, // 1 GB
          apiCalls: 10000, // per month
        },
        isActive: true,
        isDefault: false,
        trialDays: 14, // 14 days free trial
        sortOrder: 2,
      });

      await freePlan.save();
      await basicPlan.save();
      
      fastify.log.info('✓ Default plans initialized: Free and Basic ($5/month)');
    }
  } catch (error) {
    fastify.log.error('Error initializing default plans:', error);
  }
};

await initDefaultPlans();

// Initialize cache
await initCache();

// Initialize email service
const { initEmailService } = await import('./services/email.js');
await initEmailService();

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });
await fastify.register(clientsRoutes, { prefix: '/api/clients' });
await fastify.register(incomeRoutes, { prefix: '/api/income' });
await fastify.register(expensesRoutes, { prefix: '/api/expenses' });
await fastify.register(debtsRoutes, { prefix: '/api/debts' });
await fastify.register(goalsRoutes, { prefix: '/api/goals' });
await fastify.register(invoicesRoutes, { prefix: '/api/invoices' });
await fastify.register(todosRoutes, { prefix: '/api/todos' });
await fastify.register(listsRoutes, { prefix: '/api/lists' });
await fastify.register(savingsRoutes, { prefix: '/api/savings' });
await fastify.register(savingsTransactionsRoutes, { prefix: '/api/savings-transactions' });
await fastify.register(openingBalancesRoutes, { prefix: '/api/opening-balances' });
await fastify.register(expectedIncomeRoutes, { prefix: '/api/expected-income' });
await fastify.register(migrationRoutes, { prefix: '/api/migration' });
await fastify.register(healthRoutes, { prefix: '/api' });
await fastify.register(notificationRoutes, { prefix: '/api/notifications' });
await fastify.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
await fastify.register(paymentRoutes, { prefix: '/api/payments' });
await fastify.register(messageRoutes, { prefix: '/api/messages' });
await fastify.register(ticketRoutes, { prefix: '/api/tickets' });
await fastify.register(announcementRoutes, { prefix: '/api/announcements' });
await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
await fastify.register(apiKeyRoutes, { prefix: '/api/api-keys' });
await fastify.register(docsRoutes);
await fastify.register(plansRoutes, { prefix: '/api' });
await fastify.register(dashboardRoutes);
await fastify.register(appUpdatesRoutes);
await fastify.register(securityRoutes);
await fastify.register(aiRoutes);

// Add performance monitoring to all routes
fastify.addHook('onRequest', performanceMonitoring);
fastify.addHook('onResponse', performanceMonitoringResponse);

// Root route - API info
fastify.get('/', async (request, reply) => {
  return {
    message: 'YUR Finance API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      data: '/api/clients, /api/income, /api/expenses, etc.',
      plans: '/api/plans',
    },
    health: '/health',
    timestamp: new Date().toISOString(),
  };
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
    
    // Initialize real-time communication after server is ready
    try {
      const server = fastify.server;
      await initializeRealtime(server);
      console.log('Real-time communication initialized');
    } catch (error) {
      console.warn('Failed to initialize Socket.IO (optional):', error.message);
      // Don't fail server startup if Socket.IO fails
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
