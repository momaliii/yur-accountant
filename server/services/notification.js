import Notification from '../models/Notification.js';
import { sendNotificationToUser } from './realtime.js';
import { sendNotificationEmail } from './email.js';

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type = 'info',
  title,
  message,
  actionUrl = null,
  actionText = null,
  metadata = {},
  priority = 'normal',
  expiresAt = null,
}) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      actionUrl,
      actionText,
      metadata,
      priority,
      expiresAt,
    });

    await notification.save();
    
    // Send real-time notification
    try {
      sendNotificationToUser(userId, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      // Don't fail if real-time fails
    }

    // Send email notification if priority is high or urgent
    if (priority === 'high' || priority === 'urgent') {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        if (user && user.email) {
          await sendNotificationEmail(user.email, notification);
        }
      } catch (error) {
        console.error('Error sending email notification:', error);
        // Don't fail if email fails
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(notifications) {
  try {
    const created = await Notification.insertMany(notifications);
    return created;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const {
      limit = 50,
      skip = 0,
      unreadOnly = false,
      type = null,
    } = options;

    const query = { userId };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    return {
      notifications,
      unreadCount,
      total: await Notification.countDocuments({ userId }),
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId) {
  try {
    const result = await Notification.deleteMany({
      userId,
      read: true,
    });

    return result;
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    throw error;
  }
}

/**
 * Get notification preferences (can be extended)
 */
export function getNotificationPreferences(userId) {
  // This can be extended to fetch from user settings
  return {
    email: true,
    push: true,
    inApp: true,
  };
}
