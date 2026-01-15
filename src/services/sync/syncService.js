import { backupDB } from '../db/database.js';
import authService from '../auth/authService.js';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.periodicSyncInterval = null;
    this.periodicSyncIntervalMinutes = 5; // Default: sync every 5 minutes
  }

  // Check if user is authenticated
  isAuthenticated() {
    return authService.isAuthenticated();
  }

  // Sync all data from server to local
  async syncFromServer() {
    if (!this.isAuthenticated()) {
      console.log('Not authenticated, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, error: 'Sync in progress' };
    }

    this.isSyncing = true;

    // Use Supabase (default)
    try {
      const supabaseSync = (await import('../supabase/supabaseSync.js')).default;
      if (supabaseSync.isAvailable()) {
        const result = await supabaseSync.syncFromSupabase();
        if (result.success) {
          this.lastSyncTime = new Date().toISOString();
          localStorage.setItem('lastSyncTime', this.lastSyncTime);
          this.isSyncing = false;
          return result;
        } else {
          this.isSyncing = false;
          return result;
        }
      } else {
        this.isSyncing = false;
        return { success: false, error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' };
      }
    } catch (error) {
      console.error('Error syncing from Supabase:', error);
      this.isSyncing = false;
      return { success: false, error: error.message };
    }
  }



  // Sync all data from local to server (Supabase)
  async syncToServer() {
    if (!this.isAuthenticated()) {
      console.log('Not authenticated, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, error: 'Sync in progress' };
    }

    this.isSyncing = true;

    try {
      const supabaseSync = (await import('../supabase/supabaseSync.js')).default;
      if (!supabaseSync.isAvailable()) {
        this.isSyncing = false;
        return { success: false, error: 'Supabase not configured' };
      }

      // Export from IndexedDB
      const localData = await backupDB.exportAll();

      // Sync each entity type to Supabase
      const entityTypes = [
        { name: 'clients', entity: 'client' },
        { name: 'income', entity: 'income' },
        { name: 'expenses', entity: 'expense' },
        { name: 'debts', entity: 'debt' },
        { name: 'goals', entity: 'goal' },
        { name: 'invoices', entity: 'invoice' },
        { name: 'todos', entity: 'todo' },
        { name: 'lists', entity: 'list' },
        { name: 'savings', entity: 'saving' },
        { name: 'savingsTransactions', entity: 'savingsTransaction' },
        { name: 'openingBalances', entity: 'openingBalance' },
        { name: 'expectedIncome', entity: 'expectedIncome' },
      ];

      let syncedCount = 0;
      const errors = [];

      for (const { name, entity } of entityTypes) {
        const items = localData[name] || [];
        for (const item of items) {
          try {
            // Check if item has a valid Supabase UUID
            const hasValidSupabaseId = item.supabase_id && supabaseSync.isValidUUID(item.supabase_id);
            const hasValidMongoId = item.mongoId && supabaseSync.isValidUUID(item.mongoId);
            
            if (hasValidSupabaseId || hasValidMongoId) {
              // Update existing record in Supabase
              const result = await supabaseSync.syncEntity(entity, 'update', item);
              if (result && result.id && item.id) {
                // Update local supabase_id if we got a new UUID
                await supabaseSync.updateLocalSupabaseId(entity, item.id, result.id);
              }
            } else {
              // No valid Supabase ID - create new record
              // This handles old data with MongoDB ObjectIds
              // Old data will be recreated in Supabase with new UUIDs
              const result = await supabaseSync.syncEntity(entity, 'add', item);
              if (result && result.id && item.id) {
                // Save the new Supabase UUID to local data
                await supabaseSync.updateLocalSupabaseId(entity, item.id, result.id);
                console.log(`Created new Supabase record for ${entity} (local ID: ${item.id})`);
              }
            }
            syncedCount++;
          } catch (error) {
            console.error(`Error syncing ${entity}:`, error);
            errors.push({ entity, item: { id: item.id, name: item.name || item.title || 'N/A' }, error: error.message });
          }
        }
      }

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);

      return {
        success: errors.length === 0,
        syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Sync to server error:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Full bidirectional sync (with optional conflict resolution)
  async fullSync(useConflictResolution = false) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      if (useConflictResolution) {
        return await this.syncWithConflictResolution();
      }

      // First sync local to server (push changes)
      const pushResult = await this.syncToServer();
      
      // Then sync server to local (pull latest)
      const pullResult = await this.syncFromServer();

      return {
        success: pushResult.success && pullResult.success,
        push: pushResult,
        pull: pullResult,
      };
    } catch (error) {
      console.error('Full sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime || localStorage.getItem('lastSyncTime'),
      queueLength: this.syncQueue.length,
    };
  }

  // Queue an operation for later sync
  queueOperation(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  // Process queued operations
  async processQueue() {
    if (!this.isAuthenticated() || this.syncQueue.length === 0) {
      return;
    }

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case 'create':
            await this.executeCreate(operation);
            break;
          case 'update':
            await this.executeUpdate(operation);
            break;
          case 'delete':
            await this.executeDelete(operation);
            break;
        }
      } catch (error) {
        console.error('Queue operation error:', error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }

    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async executeCreate(operation) {
    const { entity, data } = operation;
    try {
      const supabaseSync = (await import('../supabase/supabaseSync.js')).default;
      if (supabaseSync.isAvailable()) {
        await supabaseSync.syncEntity(entity, 'add', data);
      }
    } catch (error) {
      console.error('Error executing create operation:', error);
      throw error;
    }
  }

  async executeUpdate(operation) {
    const { entity, id, data } = operation;
    try {
      const supabaseSync = (await import('../supabase/supabaseSync.js')).default;
      if (supabaseSync.isAvailable()) {
        await supabaseSync.syncEntity(entity, 'update', { ...data, id });
      }
    } catch (error) {
      console.error('Error executing update operation:', error);
      throw error;
    }
  }

  async executeDelete(operation) {
    const { entity, id } = operation;
    try {
      const supabaseSync = (await import('../supabase/supabaseSync.js')).default;
      if (supabaseSync.isAvailable()) {
        await supabaseSync.syncEntity(entity, 'delete', { id });
      }
    } catch (error) {
      console.error('Error executing delete operation:', error);
      throw error;
    }
  }

  // Start periodic sync
  startPeriodicSync(intervalMinutes = 5) {
    this.periodicSyncIntervalMinutes = intervalMinutes;
    
    // Clear existing interval if any
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
    }

    // Only start if authenticated
    if (!this.isAuthenticated()) {
      return;
    }

    // Check if conflict resolution is enabled
    const useConflictResolution = localStorage.getItem('useConflictResolution') === 'true';

    // Sync immediately, then set up interval
    this.fullSync(useConflictResolution).catch(err => {
      console.error('Periodic sync error:', err);
    });

    // Set up periodic sync
    this.periodicSyncInterval = setInterval(() => {
      if (this.isAuthenticated() && navigator.onLine) {
        console.log('Running periodic sync...');
        this.fullSync(useConflictResolution).catch(err => {
          console.error('Periodic sync error:', err);
        });
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Periodic sync started: every ${intervalMinutes} minutes`);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  // Conflict resolution: merge local and server data
  async resolveConflict(localData, serverData, entity) {
    // Strategy: Last Write Wins (LWW) based on updatedAt timestamp
    // If no timestamp, prefer server data (more recent)
    
    const localUpdated = localData.updatedAt ? new Date(localData.updatedAt) : new Date(localData.createdAt || 0);
    const serverUpdated = serverData.updatedAt ? new Date(serverData.updatedAt) : new Date(serverData.createdAt || 0);

    if (serverUpdated > localUpdated) {
      // Server is newer, use server data
      console.log(`Conflict resolved: using server data for ${entity} (server newer)`);
      return { resolved: true, data: serverData, source: 'server' };
    } else if (localUpdated > serverUpdated) {
      // Local is newer, use local data
      console.log(`Conflict resolved: using local data for ${entity} (local newer)`);
      return { resolved: true, data: localData, source: 'local' };
    } else {
      // Same timestamp, prefer server (has mongoId)
      console.log(`Conflict resolved: using server data for ${entity} (same timestamp)`);
      return { resolved: true, data: serverData, source: 'server' };
    }
  }

  // Sync with conflict resolution
  async syncWithConflictResolution() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const conflictResolution = (await import('./conflictResolution.js')).default;
      const { backupDB } = await import('../db/database.js');
      
      // Get local data
      const localData = await backupDB.exportAll();

      // First, sync local to server (push changes)
      await this.syncToServer();

      // Then, sync server to local (pull latest)
      const pullResult = await this.syncFromServer();
      
      if (!pullResult.success) {
        return pullResult;
      }

      // Get server data after sync
      const serverData = await backupDB.exportAll();

      // Detect and resolve conflicts
      const entityTypes = [
        'clients', 'income', 'expenses', 'debts', 'goals',
        'invoices', 'todos', 'lists', 'savings', 'savingsTransactions',
        'openingBalances', 'expectedIncome'
      ];

      const allConflicts = [];
      const resolvedData = { ...serverData };

      for (const entity of entityTypes) {
        const localItems = localData[entity] || [];
        const serverItems = serverData[entity] || [];
        
        // Detect conflicts
        const conflicts = conflictResolution.detectConflicts(localItems, serverItems, entity);
        
        if (conflicts.length > 0) {
          console.log(`Found ${conflicts.length} conflicts in ${entity}`);
          
          // Resolve each conflict
          for (const conflict of conflicts) {
            const resolution = conflictResolution.resolveConflict(
              conflict.localData,
              conflict.serverData,
              entity
            );
            
            if (resolution.resolved) {
              // Update resolved data
              const index = resolvedData[entity].findIndex(
                item => (item.mongoId || item._id || item.id) === 
                        (conflict.localData.mongoId || conflict.localData._id || conflict.localData.id)
              );
              
              if (index !== -1) {
                resolvedData[entity][index] = resolution.data;
              }
              
              allConflicts.push({
                entity,
                ...resolution,
                localTimestamp: conflict.localTimestamp,
                serverTimestamp: conflict.serverTimestamp,
              });
            } else {
              // Manual resolution required
              allConflicts.push({
                entity,
                ...resolution,
                requiresManualResolution: true,
              });
            }
          }
        }
      }

      // If conflicts were resolved, update local database
      if (allConflicts.length > 0) {
        await backupDB.importAll(resolvedData);
        console.log(`Resolved ${allConflicts.length} conflicts`);
      }

      return {
        success: pullResult.success,
        conflicts: allConflicts.length,
        conflictsDetails: allConflicts,
        data: pullResult.data,
      };
    } catch (error) {
      console.error('Sync with conflict resolution error:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize sync service
  init() {
    // Load queue from localStorage
    const savedQueue = localStorage.getItem('syncQueue');
    if (savedQueue) {
      try {
        this.syncQueue = JSON.parse(savedQueue);
      } catch (error) {
        console.error('Error loading sync queue:', error);
        this.syncQueue = [];
      }
    }

    // Load last sync time
    this.lastSyncTime = localStorage.getItem('lastSyncTime');

    // Load periodic sync interval from settings
    const savedInterval = localStorage.getItem('periodicSyncIntervalMinutes');
    if (savedInterval) {
      this.periodicSyncIntervalMinutes = parseInt(savedInterval, 10);
    }

    // Process queue on init if authenticated
    if (this.isAuthenticated()) {
      this.processQueue();
      
      // Start periodic sync if enabled
      const periodicSyncEnabled = localStorage.getItem('periodicSyncEnabled') !== 'false';
      if (periodicSyncEnabled) {
        this.startPeriodicSync(this.periodicSyncIntervalMinutes);
      }
    }
  }
}

const syncService = new SyncService();
syncService.init();

export default syncService;
