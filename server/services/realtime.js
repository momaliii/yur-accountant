let Server = null;
let io = null;

export async function initializeRealtime(server) {
  // Try to import socket.io, but don't fail if it's not installed
  try {
    if (!Server) {
      // Dynamic import to avoid failing if package not installed
      const socketIOModule = await import('socket.io');
      Server = socketIOModule.Server;
    }
  } catch (error) {
    console.warn('Socket.IO package not found, real-time features disabled');
    return null;
  }

  if (!Server) {
    console.warn('Socket.IO Server not available');
    return null;
  }

  try {
    io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join user-specific room
      socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Leave user room
      socket.on('leave-user-room', (userId) => {
        socket.leave(`user:${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('Socket.IO initialized successfully');
    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    return null;
  }
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId, notification) {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Send notification to all users
 */
export function broadcastNotification(notification) {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.emit('notification', notification);
}

/**
 * Send system update to all users
 */
export function broadcastSystemUpdate(update) {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.emit('system-update', update);
}

export function getIO() {
  return io;
}
