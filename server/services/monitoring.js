import os from 'os';

// Get system health metrics
export async function getSystemHealth() {
  try {
    const { getDBStats } = await import('../config/database.js');
    const dbStats = await getDBStats();
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: {
        uptime: Math.floor(uptime),
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          systemTotal: totalMem,
          systemFree: freeMem,
          systemUsed: totalMem - freeMem,
          systemUsagePercent: ((totalMem - freeMem) / totalMem) * 100,
        },
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      },
      database: dbStats,
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Get API performance metrics
const apiMetrics = {
  requests: [],
  errors: [],
  responseTimes: [],
};

export function recordAPIMetric(endpoint, method, statusCode, responseTime) {
  const metric = {
    endpoint,
    method,
    statusCode,
    responseTime,
    timestamp: new Date(),
  };

  apiMetrics.requests.push(metric);
  
  // Keep only last 1000 requests
  if (apiMetrics.requests.length > 1000) {
    apiMetrics.requests.shift();
  }

  if (statusCode >= 400) {
    apiMetrics.errors.push(metric);
    if (apiMetrics.errors.length > 100) {
      apiMetrics.errors.shift();
    }
  }

  apiMetrics.responseTimes.push(responseTime);
  if (apiMetrics.responseTimes.length > 1000) {
    apiMetrics.responseTimes.shift();
  }
}

export function getAPIMetrics() {
  const requests = apiMetrics.requests;
  const errors = apiMetrics.errors;
  const responseTimes = apiMetrics.responseTimes;

  const totalRequests = requests.length;
  const totalErrors = errors.length;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  // Group by endpoint
  const endpointStats = {};
  requests.forEach(req => {
    const key = `${req.method} ${req.endpoint}`;
    if (!endpointStats[key]) {
      endpointStats[key] = {
        endpoint: req.endpoint,
        method: req.method,
        count: 0,
        totalTime: 0,
        errors: 0,
      };
    }
    endpointStats[key].count++;
    endpointStats[key].totalTime += req.responseTime;
    if (req.statusCode >= 400) {
      endpointStats[key].errors++;
    }
  });

  // Calculate averages
  Object.keys(endpointStats).forEach(key => {
    const stat = endpointStats[key];
    stat.avgTime = stat.totalTime / stat.count;
    stat.errorRate = (stat.errors / stat.count) * 100;
  });

  return {
    totalRequests,
    totalErrors,
    errorRate: errorRate.toFixed(2),
    responseTime: {
      avg: avgResponseTime.toFixed(2),
      min: minResponseTime.toFixed(2),
      max: maxResponseTime.toFixed(2),
    },
    endpoints: Object.values(endpointStats),
    recentErrors: errors.slice(-10),
  };
}

// Performance monitoring - store start time on request
export function performanceMonitoring(request, reply, done) {
  // Store start time on request object for use in onResponse hook
  request.startTime = Date.now();
  done();
}

// Response monitoring hook
export function performanceMonitoringResponse(request, reply, done) {
  try {
    if (request.startTime) {
      const responseTime = Date.now() - request.startTime;
      const endpoint = request.url.split('?')[0]; // Remove query params
      recordAPIMetric(endpoint, request.method, reply.statusCode || 200, responseTime);
      
      // Add response time header
      reply.header('X-Response-Time', `${responseTime}ms`);
    }
  } catch (error) {
    // Don't fail requests if monitoring fails
    console.error('Performance monitoring error:', error);
  }
  
  done();
}
