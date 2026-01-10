import * as localDB from '../db/database.js';

// Offline queue for operations
const offlineQueue = [];

// Check if online
export function isOnline() {
  return navigator.onLine;
}

// Add operation to offline queue
export function queueOperation(operation) {
  offlineQueue.push({
    ...operation,
    timestamp: new Date().toISOString(),
  });
  saveQueue();
}

// Process offline queue when back online
export async function processOfflineQueue() {
  if (!isOnline() || offlineQueue.length === 0) {
    return;
  }

  const operations = [...offlineQueue];
  offlineQueue.length = 0;
  saveQueue();

  for (const operation of operations) {
    try {
      // Import API services dynamically
      const apiServices = await import('../api/index.js');
      
      switch (operation.type) {
        case 'create':
          await apiServices[`${operation.entity}Service`]?.add(operation.data);
          break;
        case 'update':
          await apiServices[`${operation.entity}Service`]?.update(operation.id, operation.data);
          break;
        case 'delete':
          await apiServices[`${operation.entity}Service`]?.remove(operation.id);
          break;
      }
    } catch (error) {
      console.error('Failed to sync offline operation:', error);
      // Re-queue failed operations
      offlineQueue.push(operation);
    }
  }

  saveQueue();
}

// Save queue to localStorage
function saveQueue() {
  try {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

// Load queue from localStorage
export function loadOfflineQueue() {
  try {
    const saved = localStorage.getItem('offlineQueue');
    if (saved) {
      const queue = JSON.parse(saved);
      offlineQueue.push(...queue);
    }
  } catch (error) {
    console.error('Failed to load offline queue:', error);
  }
}

// Clear offline queue
export function clearOfflineQueue() {
  offlineQueue.length = 0;
  localStorage.removeItem('offlineQueue');
}

// Initialize offline service
export function initOfflineService() {
  // Load existing queue
  loadOfflineQueue();

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Back online, processing queue...');
    processOfflineQueue();
  });

  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('Gone offline, operations will be queued');
  });

  // Process queue on load if online
  if (isOnline()) {
    processOfflineQueue();
  }
}

// Get offline queue status
export function getOfflineQueueStatus() {
  return {
    queueLength: offlineQueue.length,
    isOnline: isOnline(),
  };
}
