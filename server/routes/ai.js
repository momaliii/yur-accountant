// AI routes for dashboard optimization and suggestions
// Note: This is a placeholder implementation. In production, you would integrate
// with an actual AI service like OpenAI, Anthropic, or a custom ML model.

export default async function aiRoutes(fastify) {
  // Generate dashboard suggestions based on user data
  fastify.post('/api/ai/dashboard/suggest', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { userData } = request.body;
      const userId = request.user.id;

      // Import models to analyze user data
      const Income = (await import('../models/Income.js')).default;
      const Expense = (await import('../models/Expense.js')).default;
      const Client = (await import('../models/Client.js')).default;
      const Goal = (await import('../models/Goal.js')).default;
      const Invoice = (await import('../models/Invoice.js')).default;

      // Get actual data counts
      const [incomeCount, expenseCount, clientCount, goalCount, invoiceCount] = await Promise.all([
        Income.countDocuments({ userId }),
        Expense.countDocuments({ userId }),
        Client.countDocuments({ userId }),
        Goal.countDocuments({ userId }),
        Invoice.countDocuments({ userId }),
      ]);

      // AI-powered suggestions based on data patterns
      const suggestions = [];

      // High priority: Income tracking if user has income
      if (incomeCount > 0) {
        suggestions.push({
          type: 'stat-card',
          settings: { statType: 'income' },
          reason: `You have ${incomeCount} income entries. Track your monthly income.`,
          priority: 'high',
        });

        if (incomeCount > 10) {
          suggestions.push({
            type: 'chart',
            settings: { chartType: 'line', period: 'month' },
            reason: 'Visualize your income trends over time',
            priority: 'high',
          });
        }
      }

      // High priority: Expense tracking if user has expenses
      if (expenseCount > 0) {
        suggestions.push({
          type: 'stat-card',
          settings: { statType: 'expenses' },
          reason: `You have ${expenseCount} expense entries. Monitor your spending.`,
          priority: 'high',
        });

        if (expenseCount > 10) {
          suggestions.push({
            type: 'trends',
            settings: {},
            reason: 'Analyze your expense patterns',
            priority: 'medium',
          });
        }
      }

      // Medium priority: Client management if user has clients
      if (clientCount > 0) {
        suggestions.push({
          type: 'clients',
          settings: { limit: 5 },
          reason: `You have ${clientCount} clients. Track your top performers.`,
          priority: 'medium',
        });
      }

      // Medium priority: Goals if user has goals
      if (goalCount > 0) {
        suggestions.push({
          type: 'goals',
          settings: {},
          reason: `You have ${goalCount} goals. Monitor your progress.`,
          priority: 'medium',
        });
      }

      // Medium priority: Calendar if user has invoices
      if (invoiceCount > 0) {
        suggestions.push({
          type: 'calendar',
          settings: {},
          reason: `You have ${invoiceCount} invoices. Stay on top of deadlines.`,
          priority: 'medium',
        });
      }

      // Always suggest quick actions and recent activity
      suggestions.push({
        type: 'quick-actions',
        settings: {},
        reason: 'Quick access to frequently used features',
        priority: 'low',
      });

      suggestions.push({
        type: 'recent-activity',
        settings: { limit: 10 },
        reason: 'Stay updated with your latest transactions',
        priority: 'low',
      });

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return reply.send({ suggestions });
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return reply.status(500).send({ error: 'Failed to generate suggestions' });
    }
  });

  // Optimize existing dashboard layout
  fastify.post('/api/ai/dashboard/optimize', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { currentLayout, userData } = request.body;
      const userId = request.user.id;

      // Import models
      const Income = (await import('../models/Income.js')).default;
      const Expense = (await import('../models/Expense.js')).default;
      const Client = (await import('../models/Client.js')).default;
      const Goal = (await import('../models/Goal.js')).default;

      // Get data counts
      const [incomeCount, expenseCount, clientCount, goalCount] = await Promise.all([
        Income.countDocuments({ userId }),
        Expense.countDocuments({ userId }),
        Client.countDocuments({ userId }),
        Goal.countDocuments({ userId }),
      ]);

      let optimizedWidgets = [...(currentLayout.widgets || [])];

      // Remove widgets for data types user doesn't have
      if (incomeCount === 0) {
        optimizedWidgets = optimizedWidgets.filter(
          (w) => !(w.type === 'stat-card' && w.settings?.statType === 'income')
        );
      }

      if (expenseCount === 0) {
        optimizedWidgets = optimizedWidgets.filter(
          (w) => !(w.type === 'stat-card' && w.settings?.statType === 'expenses')
        );
      }

      if (clientCount === 0) {
        optimizedWidgets = optimizedWidgets.filter((w) => w.type !== 'clients');
      }

      if (goalCount === 0) {
        optimizedWidgets = optimizedWidgets.filter((w) => w.type !== 'goals');
      }

      // Optimize widget positions (simple grid layout)
      let x = 0;
      let y = 0;
      const maxWidth = 12;

      optimizedWidgets = optimizedWidgets.map((widget) => {
        const newWidget = {
          ...widget,
          position: { x, y },
        };

        x += widget.size.w;
        if (x >= maxWidth) {
          x = 0;
          y += widget.size.h;
        }

        return newWidget;
      });

      return reply.send({
        widgets: optimizedWidgets,
        layout: currentLayout.layout,
      });
    } catch (error) {
      console.error('Error optimizing dashboard:', error);
      return reply.status(500).send({ error: 'Failed to optimize dashboard' });
    }
  });
}
