import ActivityLog from '../models/ActivityLog.js';

/**
 * Log user activity
 * @param {Object} options - Activity log options
 * @param {String} options.userId - User ID
 * @param {String} options.action - Action type
 * @param {String} options.entityType - Entity type (optional)
 * @param {String} options.entityId - Entity ID (optional)
 * @param {Object} options.details - Additional details (optional)
 * @param {String} options.ipAddress - IP address (optional)
 * @param {String} options.userAgent - User agent (optional)
 */
export async function logActivity({
  userId,
  action,
  entityType = null,
  entityId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
}) {
  try {
    if (!userId || !action) {
      return; // Skip logging if required fields are missing
    }

    const activityLog = new ActivityLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });

    await activityLog.save();
  } catch (error) {
    // Don't throw errors for logging failures - just log to console
    console.error('Failed to log activity:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request) {
  return (
    request.ip ||
    request.headers['x-forwarded-for']?.split(',')[0] ||
    request.headers['x-real-ip'] ||
    request.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Get user agent from request
 */
export function getUserAgent(request) {
  return request.headers['user-agent'] || 'unknown';
}
