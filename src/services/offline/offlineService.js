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

  // Check if user is authenticated
  const authService = (await import('../auth/authService.js')).default;
  if (!authService.isAuthenticated()) {
    console.log('Not authenticated, skipping offline queue processing');
    return;
  }

  const operations = [...offlineQueue];
  offlineQueue.length = 0;
  saveQueue();

  console.log(`Processing ${operations.length} queued operations...`);

  for (const operation of operations) {
    try {
      // Use syncToAPI from useStore
      const { useDataStore } = await import('../../stores/useStore.js');
      const store = useDataStore.getState();
      
      // Map operation types
      const operationType = operation.type === 'create' ? 'add' : 
                           operation.type === 'remove' ? 'delete' : 
                           operation.type;
      
      await store.syncToAPI(operation.entity, operationType, operation.data || { ...operation.data, id: operation.id });
      
      console.log(`Successfully synced ${operation.entity} ${operation.type}`);
    } catch (error) {
      console.error('Failed to sync offline operation:', error);
      // Re-queue failed operations (with retry limit)
      if (!operation.retryCount) {
        operation.retryCount = 0;
      }
      operation.retryCount++;
      
      // Only re-queue if retry count is less than 3
      if (operation.retryCount < 3) {
        offlineQueue.push(operation);
      } else {
        console.error(`Operation failed after ${operation.retryCount} retries, removing from queue:`, operation);
      }
    }
  }

  saveQueue();
  
  if (offlineQueue.length > 0) {
    console.log(`${offlineQueue.length} operations still in queue`);
  } else {
    console.log('All queued operations processed successfully');
  }
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
