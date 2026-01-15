/**
 * Conflict Resolution Service
 * Handles conflicts when the same data is modified on multiple devices
 */

class ConflictResolutionService {
  constructor() {
    this.strategies = {
      LAST_WRITE_WINS: 'last_write_wins',
      SERVER_WINS: 'server_wins',
      CLIENT_WINS: 'client_wins',
      MANUAL: 'manual',
      MERGE: 'merge',
    };
    
    this.defaultStrategy = this.strategies.LAST_WRITE_WINS;
  }

  /**
   * Resolve conflict between local and server data
   * @param {Object} localData - Local version of the data
   * @param {Object} serverData - Server version of the data
   * @param {String} entity - Entity type (client, income, etc.)
   * @param {String} strategy - Resolution strategy to use
   * @returns {Object} Resolved data and metadata
   */
  resolveConflict(localData, serverData, entity, strategy = null) {
    const resolutionStrategy = strategy || this.defaultStrategy;

    switch (resolutionStrategy) {
      case this.strategies.LAST_WRITE_WINS:
        return this.lastWriteWins(localData, serverData, entity);
      
      case this.strategies.SERVER_WINS:
        return this.serverWins(localData, serverData, entity);
      
      case this.strategies.CLIENT_WINS:
        return this.clientWins(localData, serverData, entity);
      
      case this.strategies.MERGE:
        return this.merge(localData, serverData, entity);
      
      case this.strategies.MANUAL:
        return this.manualResolution(localData, serverData, entity);
      
      default:
        return this.lastWriteWins(localData, serverData, entity);
    }
  }

  /**
   * Last Write Wins: Use the version with the most recent updatedAt timestamp
   */
  lastWriteWins(localData, serverData, entity) {
    const localTime = this.getTimestamp(localData);
    const serverTime = this.getTimestamp(serverData);

    if (serverTime > localTime) {
      return {
        resolved: true,
        data: serverData,
        source: 'server',
        reason: `Server version is newer (${serverTime} > ${localTime})`,
        strategy: this.strategies.LAST_WRITE_WINS,
      };
    } else if (localTime > serverTime) {
      return {
        resolved: true,
        data: localData,
        source: 'local',
        reason: `Local version is newer (${localTime} > ${serverTime})`,
        strategy: this.strategies.LAST_WRITE_WINS,
      };
    } else {
      // Same timestamp, prefer server (has mongoId)
      return {
        resolved: true,
        data: serverData,
        source: 'server',
        reason: 'Same timestamp, using server version',
        strategy: this.strategies.LAST_WRITE_WINS,
      };
    }
  }

  /**
   * Server Wins: Always use server version
   */
  serverWins(localData, serverData, entity) {
    return {
      resolved: true,
      data: serverData,
      source: 'server',
      reason: 'Server wins strategy',
      strategy: this.strategies.SERVER_WINS,
    };
  }

  /**
   * Client Wins: Always use local version
   */
  clientWins(localData, serverData, entity) {
    return {
      resolved: true,
      data: localData,
      source: 'local',
      reason: 'Client wins strategy',
      strategy: this.strategies.CLIENT_WINS,
    };
  }

  /**
   * Merge: Intelligently merge both versions
   */
  merge(localData, serverData, entity) {
    const merged = { ...serverData };

    // For most entities, merge by taking non-null values from local
    // This is a simple merge - can be enhanced for specific entity types
    Object.keys(localData).forEach(key => {
      if (localData[key] !== null && localData[key] !== undefined) {
        // Prefer local value if it's more recent or if server value is null
        if (merged[key] === null || merged[key] === undefined) {
          merged[key] = localData[key];
        } else {
          // Compare timestamps if available
          const localKeyTime = this.getFieldTimestamp(localData, key);
          const serverKeyTime = this.getFieldTimestamp(serverData, key);
          
          if (localKeyTime > serverKeyTime) {
            merged[key] = localData[key];
          }
        }
      }
    });

    // Always keep server's mongoId
    if (serverData._id || serverData.mongoId) {
      merged.mongoId = serverData._id || serverData.mongoId;
      merged._id = serverData._id || serverData.mongoId;
    }

    // Update timestamp to now
    merged.updatedAt = new Date().toISOString();

    return {
      resolved: true,
      data: merged,
      source: 'merged',
      reason: 'Merged local and server versions',
      strategy: this.strategies.MERGE,
    };
  }

  /**
   * Manual Resolution: Return both versions for user to choose
   */
  manualResolution(localData, serverData, entity) {
    return {
      resolved: false,
      localData,
      serverData,
      source: 'manual',
      reason: 'Requires manual resolution',
      strategy: this.strategies.MANUAL,
    };
  }

  /**
   * Get timestamp from data object
   */
  getTimestamp(data) {
    if (data.updatedAt) {
      return new Date(data.updatedAt).getTime();
    }
    if (data.createdAt) {
      return new Date(data.createdAt).getTime();
    }
    return 0;
  }

  /**
   * Get field-specific timestamp (for merge strategy)
   */
  getFieldTimestamp(data, field) {
    // This would require field-level timestamps, which we don't have
    // For now, use the document timestamp
    return this.getTimestamp(data);
  }

  /**
   * Detect conflicts between local and server data
   * @param {Array} localData - Array of local records
   * @param {Array} serverData - Array of server records
   * @param {String} entity - Entity type
   * @returns {Array} Array of conflict objects
   */
  detectConflicts(localData, serverData, entity) {
    const conflicts = [];
    const serverMap = new Map();

    // Create map of server data by mongoId or id
    serverData.forEach(serverItem => {
      const key = serverItem._id || serverItem.mongoId || serverItem.id;
      if (key) {
        serverMap.set(String(key), serverItem);
      }
    });

    // Check each local item for conflicts
    localData.forEach(localItem => {
      const key = localItem.mongoId || localItem._id || localItem.id;
      if (!key) return;

      const serverItem = serverMap.get(String(key));
      if (!serverItem) return;

      // Check if data differs
      if (this.hasConflict(localItem, serverItem)) {
        conflicts.push({
          entity,
          localData: localItem,
          serverData: serverItem,
          localTimestamp: this.getTimestamp(localItem),
          serverTimestamp: this.getTimestamp(serverItem),
        });
      }
    });

    return conflicts;
  }

  /**
   * Check if two data objects have a conflict
   */
  hasConflict(localData, serverData) {
    // Simple conflict detection: compare updatedAt timestamps
    const localTime = this.getTimestamp(localData);
    const serverTime = this.getTimestamp(serverData);

    // If timestamps are different, there might be a conflict
    // We consider it a conflict if both were modified (different updatedAt)
    if (localTime !== serverTime) {
      // Check if content actually differs (beyond just timestamp)
      const localContent = this.getContentHash(localData);
      const serverContent = this.getContentHash(serverData);
      
      return localContent !== serverContent;
    }

    return false;
  }

  /**
   * Get content hash (simple comparison)
   */
  getContentHash(data) {
    // Create a simplified version without timestamps and IDs for comparison
    const { id, _id, mongoId, createdAt, updatedAt, ...content } = data;
    return JSON.stringify(content);
  }

  /**
   * Set default conflict resolution strategy
   */
  setDefaultStrategy(strategy) {
    if (Object.values(this.strategies).includes(strategy)) {
      this.defaultStrategy = strategy;
      localStorage.setItem('conflictResolutionStrategy', strategy);
    }
  }

  /**
   * Get default conflict resolution strategy
   */
  getDefaultStrategy() {
    const saved = localStorage.getItem('conflictResolutionStrategy');
    return saved || this.defaultStrategy;
  }
}

const conflictResolutionService = new ConflictResolutionService();
export default conflictResolutionService;
