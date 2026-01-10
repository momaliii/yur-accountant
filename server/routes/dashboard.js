import DashboardLayout from '../models/DashboardLayout.js';

export default async function dashboardRoutes(fastify) {
  // Get user's dashboard layout
  fastify.get('/api/dashboard/layout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      let layout = await DashboardLayout.findOne({ userId });
      
      // If no layout exists, create default layout
      if (!layout) {
        layout = new DashboardLayout({
          userId,
          widgets: [],
          layout: {},
        });
        await layout.save();
      }
      
      return reply.send({ layout });
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard layout' });
    }
  });

  // Save user's dashboard layout
  fastify.put('/api/dashboard/layout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { widgets, layout } = request.body;
      
      const dashboardLayout = await DashboardLayout.findOneAndUpdate(
        { userId },
        { widgets, layout },
        { new: true, upsert: true }
      );
      
      return reply.send({ layout: dashboardLayout });
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      return reply.status(500).send({ error: 'Failed to save dashboard layout' });
    }
  });

  // Get available widget types
  fastify.get('/api/dashboard/widgets', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const widgetTypes = [
        {
          id: 'stat-card',
          name: 'Stat Card',
          description: 'Display a single statistic (income, expenses, clients, etc.)',
          defaultSize: { w: 4, h: 3 },
          settings: {
            statType: { type: 'select', options: ['income', 'expenses', 'clients', 'goals'] },
          },
        },
        {
          id: 'chart',
          name: 'Chart',
          description: 'Display income vs expenses chart',
          defaultSize: { w: 8, h: 4 },
          settings: {
            chartType: { type: 'select', options: ['line', 'bar', 'area'] },
            period: { type: 'select', options: ['week', 'month', 'year'] },
          },
        },
        {
          id: 'quick-actions',
          name: 'Quick Actions',
          description: 'Quick navigation buttons',
          defaultSize: { w: 6, h: 3 },
        },
        {
          id: 'recent-activity',
          name: 'Recent Activity',
          description: 'Show recent transactions',
          defaultSize: { w: 6, h: 4 },
          settings: {
            limit: { type: 'number', default: 10 },
          },
        },
        {
          id: 'goals',
          name: 'Goals Progress',
          description: 'Display active goals with progress',
          defaultSize: { w: 6, h: 4 },
        },
        {
          id: 'clients',
          name: 'Top Clients',
          description: 'Show top earning clients',
          defaultSize: { w: 6, h: 4 },
          settings: {
            limit: { type: 'number', default: 5 },
          },
        },
        {
          id: 'calendar',
          name: 'Calendar',
          description: 'Upcoming deadlines and events',
          defaultSize: { w: 6, h: 5 },
        },
        {
          id: 'trends',
          name: 'Monthly Trends',
          description: 'Show monthly income/expense trends',
          defaultSize: { w: 8, h: 4 },
        },
      ];
      
      return reply.send({ widgets: widgetTypes });
    } catch (error) {
      console.error('Error fetching widget types:', error);
      return reply.status(500).send({ error: 'Failed to fetch widget types' });
    }
  });
}
