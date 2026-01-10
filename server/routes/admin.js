import User from '../models/User.js';
import Client from '../models/Client.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Debt from '../models/Debt.js';
import Goal from '../models/Goal.js';
import Invoice from '../models/Invoice.js';
import Todo from '../models/Todo.js';
import Saving from '../models/Saving.js';
import ActivityLog from '../models/ActivityLog.js';
import Plan from '../models/Plan.js';
import { requireAdmin } from '../middleware/admin.js';

export default async function adminRoutes(fastify, options) {
  // Apply authentication first, then admin check
  fastify.addHook('preHandler', async (request, reply) => {
    // First authenticate (verify JWT)
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    // Then check admin
    await requireAdmin(request, reply);
  });

  // Get all users with pagination
  fastify.get('/users', async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;
      const search = request.query.search || '';
      const skip = (page - 1) * limit;

      const query = {};
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { 'profile.name': { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Get single user
  fastify.get('/users/:id', async (request, reply) => {
    try {
      const user = await User.findById(request.params.id).select('-password');
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      return user;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    }
  });

  // Get comprehensive user details
  fastify.get('/users/:id/details', async (request, reply) => {
    try {
      const userId = request.params.id;
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Get all data counts for this user
      const [
        clientsCount,
        incomeCount,
        expensesCount,
        debtsCount,
        goalsCount,
        invoicesCount,
        todosCount,
        savingsCount,
        totalIncome,
        totalExpenses,
      ] = await Promise.all([
        Client.countDocuments({ userId }),
        Income.countDocuments({ userId }),
        Expense.countDocuments({ userId }),
        Debt.countDocuments({ userId }),
        Goal.countDocuments({ userId }),
        Invoice.countDocuments({ userId }),
        Todo.countDocuments({ userId }),
        Saving.countDocuments({ userId }),
        Income.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Expense.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          subscription: user.subscription,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          isActive: user.isActive,
        },
        dataCounts: {
          clients: clientsCount,
          income: incomeCount,
          expenses: expensesCount,
          debts: debtsCount,
          goals: goalsCount,
          invoices: invoicesCount,
          todos: todosCount,
          savings: savingsCount,
        },
        totals: {
          income: totalIncome[0]?.total || 0,
          expenses: totalExpenses[0]?.total || 0,
          netProfit: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch user details' });
    }
  });

  // Create user
  fastify.post('/users', async (request, reply) => {
    try {
      const { email, password, name, role } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      const user = new User({
        email: email.toLowerCase(),
        password,
        role: role || 'user',
        profile: {
          name: name || '',
        },
      });

      await user.save();
      return reply.code(201).send(user.toJSON());
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  // Update user
  fastify.put('/users/:id', async (request, reply) => {
    try {
      const updates = { ...request.body };
      delete updates.password; // Don't update password here, use separate endpoint

      const user = await User.findByIdAndUpdate(
        request.params.id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return user;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update user' });
    }
  });

  // Delete user (soft delete)
  fastify.delete('/users/:id', async (request, reply) => {
    try {
      const user = await User.findByIdAndUpdate(
        request.params.id,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return { message: 'User deactivated successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });

  // Activate/Reactivate user
  fastify.post('/users/:id/activate', async (request, reply) => {
    try {
      const user = await User.findByIdAndUpdate(
        request.params.id,
        { isActive: true },
        { new: true }
      ).select('-password');

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return { message: 'User activated successfully', user };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to activate user' });
    }
  });

  // Reset user password
  fastify.post('/users/:id/reset-password', async (request, reply) => {
    try {
      const { newPassword } = request.body;

      if (!newPassword || newPassword.length < 6) {
        return reply.code(400).send({ error: 'Password must be at least 6 characters' });
      }

      const user = await User.findById(request.params.id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to reset password' });
    }
  });

  // Platform statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalClients,
        totalIncome,
        totalExpenses,
        totalDebts,
        totalGoals,
        totalInvoices,
        totalTodos,
        totalSavings,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Client.countDocuments(),
        Income.aggregate([
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Expense.aggregate([
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Debt.countDocuments(),
        Goal.countDocuments(),
        Invoice.countDocuments(),
        Todo.countDocuments(),
        Saving.countDocuments(),
        User.find()
          .select('-password')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const incomeTotal = totalIncome[0]?.total || 0;
      const expensesTotal = totalExpenses[0]?.total || 0;
      const netProfit = incomeTotal - expensesTotal;
      const avgIncomePerUser = activeUsers > 0 ? incomeTotal / activeUsers : 0;
      const avgExpensesPerUser = activeUsers > 0 ? expensesTotal / activeUsers : 0;

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        data: {
          clients: totalClients,
          income: incomeTotal,
          expenses: expensesTotal,
          debts: totalDebts,
          goals: totalGoals,
          invoices: totalInvoices,
          todos: totalTodos,
          savings: totalSavings,
          netProfit,
          avgIncomePerUser,
          avgExpensesPerUser,
        },
        recentUsers,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  // Analytics
  fastify.get('/analytics', async (request, reply) => {
    try {
      const days = parseInt(request.query.days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User growth (daily)
      const userGrowth = await User.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Revenue trends (income and expenses by date)
      const revenueTrends = await Income.aggregate([
        {
          $match: {
            receivedDate: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$receivedDate' },
            },
            income: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const expenseTrends = await Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' },
            },
            expenses: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Combine revenue trends
      const revenueMap = new Map();
      revenueTrends.forEach(item => {
        revenueMap.set(item._id, { date: item._id, income: item.income, expenses: 0, profit: item.income });
      });
      expenseTrends.forEach(item => {
        const existing = revenueMap.get(item._id);
        if (existing) {
          existing.expenses = item.expenses;
          existing.profit = existing.income - item.expenses;
        } else {
          revenueMap.set(item._id, { date: item._id, income: 0, expenses: item.expenses, profit: -item.expenses });
        }
      });
      const combinedRevenue = Array.from(revenueMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      // Users by subscription plan
      const subscriptionStats = await User.aggregate([
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 },
          },
        },
      ]);

      // Monthly statistics
      const monthlyStats = await Income.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$receivedDate' },
            },
            income: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]);

      const monthlyExpenses = await Expense.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$date' },
            },
            expenses: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]);

      // Combine monthly stats
      const monthlyMap = new Map();
      monthlyStats.forEach(item => {
        monthlyMap.set(item._id, { month: item._id, income: item.income, expenses: 0, profit: item.income, transactions: item.transactions });
      });
      monthlyExpenses.forEach(item => {
        const existing = monthlyMap.get(item._id);
        if (existing) {
          existing.expenses = item.expenses;
          existing.profit = existing.income - item.expenses;
          existing.transactions += item.transactions;
        } else {
          monthlyMap.set(item._id, { month: item._id, income: 0, expenses: item.expenses, profit: -item.expenses, transactions: item.transactions });
        }
      });
      const combinedMonthly = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));

      return {
        userGrowth: userGrowth.map(item => ({ date: item._id, count: item.count })),
        revenueTrends: combinedRevenue,
        subscriptionStats: subscriptionStats.map(item => ({ plan: item._id || 'free', count: item.count })),
        monthlyStats: combinedMonthly,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch analytics' });
    }
  });

  // Activity logs
  fastify.get('/activity', async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 50;
      const skip = (page - 1) * limit;
      
      const userId = request.query.userId;
      const action = request.query.action;
      const entityType = request.query.entityType;
      const startDate = request.query.startDate ? new Date(request.query.startDate) : null;
      const endDate = request.query.endDate ? new Date(request.query.endDate) : null;

      const query = {};
      
      if (userId) {
        query.userId = userId;
      }
      
      if (action) {
        query.action = action;
      }
      
      if (entityType) {
        query.entityType = entityType;
      }
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) {
          endDate.setHours(23, 59, 59, 999); // End of day
          query.timestamp.$lte = endDate;
        }
      }

      const [logs, total] = await Promise.all([
        ActivityLog.find(query)
          .populate('userId', 'email profile.name')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        ActivityLog.countDocuments(query),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch activity logs' });
    }
  });

  // Export users to CSV/JSON
  fastify.get('/export/users', async (request, reply) => {
    try {
      const format = request.query.format || 'json'; // 'json' or 'csv'
      
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Email', 'Name', 'Role', 'Subscription Plan', 'Status', 'Created At', 'Last Login'];
        const rows = users.map(user => [
          user.email || '',
          user.profile?.name || '',
          user.role || '',
          user.subscription?.plan || 'free',
          user.isActive ? 'Active' : 'Inactive',
          user.createdAt ? new Date(user.createdAt).toISOString() : '',
          user.lastLogin ? new Date(user.lastLogin).toISOString() : '',
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename=users-export.csv');
        return csvContent;
      } else {
        // Return JSON
        return {
          exportDate: new Date().toISOString(),
          total: users.length,
          users: users.map(user => ({
            id: user._id,
            email: user.email,
            name: user.profile?.name,
            role: user.role,
            subscription: user.subscription,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          })),
        };
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to export users' });
    }
  });

  // Send notification to user(s)
  fastify.post('/notifications/send', async (request, reply) => {
    try {
      const { userIds, type, title, message, actionUrl, priority } = request.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return reply.code(400).send({ error: 'userIds array is required' });
      }

      if (!title || !message) {
        return reply.code(400).send({ error: 'title and message are required' });
      }

      const { createBulkNotifications } = await import('../services/notification.js');
      
      const notifications = userIds.map(userId => ({
        userId,
        type: type || 'info',
        title,
        message,
        actionUrl: actionUrl || null,
        priority: priority || 'normal',
      }));

      const created = await createBulkNotifications(notifications);

      return {
        message: `Notifications sent to ${created.length} user(s)`,
        count: created.length,
        notifications: created,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to send notifications' });
    }
  });

  // ========== PLAN MANAGEMENT ==========

  // Get all plans
  fastify.get('/plans', async (request, reply) => {
    try {
      const plans = await Plan.find().sort({ sortOrder: 1, createdAt: 1 });
      return { plans };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch plans' });
    }
  });

  // Get single plan
  fastify.get('/plans/:id', async (request, reply) => {
    try {
      const plan = await Plan.findById(request.params.id);
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }
      return plan;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch plan' });
    }
  });

  // Create plan
  fastify.post('/plans', async (request, reply) => {
    try {
      const planData = request.body;
      
      // Generate slug if not provided
      if (!planData.slug && planData.name) {
        planData.slug = planData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      const plan = new Plan(planData);
      await plan.save();
      
      return reply.code(201).send(plan);
    } catch (error) {
      fastify.log.error(error);
      if (error.code === 11000) {
        return reply.code(400).send({ error: 'Plan with this name or slug already exists' });
      }
      return reply.code(500).send({ error: 'Failed to create plan' });
    }
  });

  // Update plan
  fastify.put('/plans/:id', async (request, reply) => {
    try {
      const updates = request.body;
      
      // Generate slug if name changed and slug not provided
      if (updates.name && !updates.slug) {
        updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      const plan = await Plan.findByIdAndUpdate(
        request.params.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      return plan;
    } catch (error) {
      fastify.log.error(error);
      if (error.code === 11000) {
        return reply.code(400).send({ error: 'Plan with this name or slug already exists' });
      }
      return reply.code(500).send({ error: 'Failed to update plan' });
    }
  });

  // Delete plan
  fastify.delete('/plans/:id', async (request, reply) => {
    try {
      const plan = await Plan.findById(request.params.id);
      if (!plan) {
        return reply.code(404).send({ error: 'Plan not found' });
      }

      // Check if plan is default
      if (plan.isDefault) {
        return reply.code(400).send({ error: 'Cannot delete default plan' });
      }

      // Check if any users are using this plan
      const Subscription = (await import('../models/Subscription.js')).default;
      const usersWithPlan = await Subscription.countDocuments({ plan: plan.slug });
      
      if (usersWithPlan > 0) {
        return reply.code(400).send({ 
          error: `Cannot delete plan. ${usersWithPlan} user(s) are currently using this plan.` 
        });
      }

      await Plan.findByIdAndDelete(request.params.id);
      return { message: 'Plan deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete plan' });
    }
  });
}
