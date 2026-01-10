export default async function docsRoutes(fastify, options) {
  // API Documentation endpoint
  fastify.get('/api/docs', async (request, reply) => {
    return {
      title: 'YUR Finance API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for YUR Finance platform',
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      endpoints: {
        auth: {
          base: '/api/auth',
          routes: [
            'POST /register - Register new user',
            'POST /login - User login',
            'GET /me - Get current user',
            'PUT /me - Update user profile',
            'POST /refresh - Refresh JWT token',
          ],
        },
        admin: {
          base: '/api/admin',
          routes: [
            'GET /users - Get all users (with pagination, filters)',
            'GET /users/:id/details - Get user details with data counts',
            'POST /users - Create user',
            'PUT /users/:id - Update user',
            'DELETE /users/:id - Deactivate user',
            'GET /stats - Platform statistics',
            'GET /analytics - Analytics data',
            'GET /activity - Activity logs',
            'GET /export/users - Export users (CSV/JSON)',
          ],
          auth: 'Admin role required',
        },
        subscriptions: {
          base: '/api/subscriptions',
          routes: [
            'GET / - Get user subscription',
            'PUT / - Update subscription',
            'POST /cancel - Cancel subscription',
            'POST /reactivate - Reactivate subscription',
          ],
          auth: 'Required',
        },
        payments: {
          base: '/api/payments',
          routes: [
            'GET / - Get user payments',
            'GET /:id - Get single payment',
            'POST / - Create payment',
          ],
          auth: 'Required',
        },
        notifications: {
          base: '/api/notifications',
          routes: [
            'GET / - Get notifications',
            'GET /unread-count - Get unread count',
            'PUT /:id/read - Mark as read',
            'PUT /read-all - Mark all as read',
            'DELETE /:id - Delete notification',
            'DELETE /read/all - Delete all read notifications',
          ],
          auth: 'Required',
        },
        messages: {
          base: '/api/messages',
          routes: [
            'GET / - Get inbox messages',
            'GET /sent - Get sent messages',
            'GET /thread/:threadId - Get message thread',
            'POST / - Send message',
            'PUT /:id/read - Mark as read',
            'DELETE /:id - Delete message',
          ],
          auth: 'Required',
        },
        tickets: {
          base: '/api/tickets',
          routes: [
            'GET / - Get user tickets',
            'GET /all - Get all tickets (admin)',
            'GET /:id - Get single ticket',
            'POST / - Create ticket',
            'PUT /:id - Update ticket',
            'POST /:id/assign - Assign ticket (admin)',
            'POST /:id/resolve - Resolve ticket',
            'POST /:id/notes - Add note',
          ],
          auth: 'Required',
        },
        announcements: {
          base: '/api/announcements',
          routes: [
            'GET / - Get active announcements',
            'GET /all - Get all announcements (admin)',
            'GET /:id - Get single announcement',
            'POST / - Create announcement (admin)',
            'PUT /:id - Update announcement (admin)',
            'DELETE /:id - Delete announcement (admin)',
          ],
          auth: 'Required',
        },
        webhooks: {
          base: '/api/webhooks',
          routes: [
            'GET / - Get user webhooks',
            'GET /:id - Get single webhook',
            'POST / - Create webhook',
            'PUT /:id - Update webhook',
            'DELETE /:id - Delete webhook',
            'POST /:id/test - Test webhook',
          ],
          auth: 'Required',
        },
        apiKeys: {
          base: '/api/api-keys',
          routes: [
            'GET / - Get user API keys',
            'GET /:id - Get single API key',
            'POST / - Create API key',
            'PUT /:id - Update API key',
            'DELETE /:id - Delete API key',
          ],
          auth: 'Required',
        },
        health: {
          base: '/api/health',
          routes: [
            'GET /health - Basic health check',
            'GET /health/detailed - Detailed system health (auth required)',
            'GET /health/metrics - API performance metrics (auth required)',
            'GET /health/database - Database statistics (auth required)',
          ],
        },
      },
      authentication: {
        type: 'JWT Bearer Token',
        header: 'Authorization: Bearer <token>',
        endpoints: {
          login: '/api/auth/login',
          register: '/api/auth/register',
        },
      },
      webhooks: {
        signature: 'X-Webhook-Signature header contains HMAC SHA256 signature',
        verification: 'Verify signature using webhook secret',
      },
      apiKeys: {
        header: 'X-API-Key: <key> or Authorization: Bearer <key>',
        permissions: 'Each key can have specific permissions',
      },
    };
  });
}
