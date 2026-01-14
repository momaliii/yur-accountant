import { backupDB } from '../db/database.js';
import clientsAPI from '../api/clients.js';
import incomeAPI from '../api/income.js';
import expensesAPI from '../api/expenses.js';
import debtsAPI from '../api/debts.js';
import goalsAPI from '../api/goals.js';
import invoicesAPI from '../api/invoices.js';
import todosAPI from '../api/todos.js';
import listsAPI from '../api/lists.js';
import savingsAPI from '../api/savings.js';
import savingsTransactionsAPI from '../api/savingsTransactions.js';
import openingBalancesAPI from '../api/openingBalances.js';
import expectedIncomeAPI from '../api/expectedIncome.js';
import authService from '../auth/authService.js';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
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

    try {
      const [
        clients,
        income,
        expenses,
        debts,
        goals,
        invoices,
        todos,
        lists,
        savings,
        savingsTransactions,
        openingBalances,
        expectedIncome,
      ] = await Promise.all([
        clientsAPI.getAll().catch(() => []),
        incomeAPI.getAll().catch(() => []),
        expensesAPI.getAll().catch(() => []),
        debtsAPI.getAll().catch(() => []),
        goalsAPI.getAll().catch(() => []),
        invoicesAPI.getAll().catch(() => []),
        todosAPI.getAll().catch(() => []),
        listsAPI.getAll().catch(() => []),
        savingsAPI.getAll().catch(() => []),
        savingsTransactionsAPI.getAll().catch(() => []),
        openingBalancesAPI.getAll().catch(() => []),
        expectedIncomeAPI.getAll().catch(() => []),
      ]);

      // Import to IndexedDB
      const data = {
        clients,
        income,
        expenses,
        debts,
        goals,
        invoices,
        todos,
        lists,
        savings,
        savingsTransactions,
        openingBalances,
        expectedIncome,
      };

      await backupDB.importAll(data);
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);

      return {
        success: true,
        data: {
          clients: clients.length,
          income: income.length,
          expenses: expenses.length,
          debts: debts.length,
          goals: goals.length,
          invoices: invoices.length,
          todos: todos.length,
          lists: lists.length,
          savings: savings.length,
          savingsTransactions: savingsTransactions.length,
          openingBalances: openingBalances.length,
          expectedIncome: expectedIncome.length,
        },
      };
    } catch (error) {
      console.error('Sync from server error:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync all data from local to server
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
      // Export from IndexedDB
      const localData = await backupDB.exportAll();

      // Upload to server via migration endpoint
      const migrationAPI = (await import('../api/migration.js')).default;
      const result = await migrationAPI.upload(localData);

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('Sync to server error:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Full bidirectional sync
  async fullSync() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
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
    const apiMap = {
      client: clientsAPI,
      income: incomeAPI,
      expense: expensesAPI,
      debt: debtsAPI,
      goal: goalsAPI,
      invoice: invoicesAPI,
      todo: todosAPI,
      list: listsAPI,
      saving: savingsAPI,
      savingsTransaction: savingsTransactionsAPI,
      openingBalance: openingBalancesAPI,
      expectedIncome: expectedIncomeAPI,
    };

    const api = apiMap[entity];
    if (api) {
      await api.add(data);
    }
  }

  async executeUpdate(operation) {
    const { entity, id, data } = operation;
    const apiMap = {
      client: clientsAPI,
      income: incomeAPI,
      expense: expensesAPI,
      debt: debtsAPI,
      goal: goalsAPI,
      invoice: invoicesAPI,
      todo: todosAPI,
      list: listsAPI,
      saving: savingsAPI,
      savingsTransaction: savingsTransactionsAPI,
      openingBalance: openingBalancesAPI,
      expectedIncome: expectedIncomeAPI,
    };

    const api = apiMap[entity];
    if (api) {
      await api.update(id, data);
    }
  }

  async executeDelete(operation) {
    const { entity, id } = operation;
    const apiMap = {
      client: clientsAPI,
      income: incomeAPI,
      expense: expensesAPI,
      debt: debtsAPI,
      goal: goalsAPI,
      invoice: invoicesAPI,
      todo: todosAPI,
      list: listsAPI,
      saving: savingsAPI,
      savingsTransaction: savingsTransactionsAPI,
      openingBalance: openingBalancesAPI,
      expectedIncome: expectedIncomeAPI,
    };

    const api = apiMap[entity];
    if (api) {
      await api.delete(id);
    }
  }

  // Initialize sync service
  async init() {
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

    // Process queue on init if authenticated (wait for completion)
    if (this.isAuthenticated() && this.syncQueue.length > 0) {
      console.log(`Processing ${this.syncQueue.length} queued sync operations on init...`);
      await this.processQueue();
      console.log('Sync queue processed on init');
    }
  }
}

const syncService = new SyncService();
// Initialize sync service (async, but don't block)
syncService.init().catch(error => {
  console.error('Error initializing sync service:', error);
});

export default syncService;
