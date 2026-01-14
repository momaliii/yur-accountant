import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clientsDB, incomeDB, expensesDB, debtsDB, goalsDB, invoicesDB, todosDB, listsDB, savingsDB, savingsTransactionsDB, openingBalancesDB, expectedIncomeDB } from '../services/db/database';
import clientsAPI from '../services/api/clients.js';
import incomeAPI from '../services/api/income.js';
import expensesAPI from '../services/api/expenses.js';
import debtsAPI from '../services/api/debts.js';
import goalsAPI from '../services/api/goals.js';
import invoicesAPI from '../services/api/invoices.js';
import todosAPI from '../services/api/todos.js';
import listsAPI from '../services/api/lists.js';
import savingsAPI from '../services/api/savings.js';
import savingsTransactionsAPI from '../services/api/savingsTransactions.js';
import openingBalancesAPI from '../services/api/openingBalances.js';
import expectedIncomeAPI from '../services/api/expectedIncome.js';
import authService from '../services/auth/authService.js';

// Settings store with persistence
export const useSettingsStore = create(
  persist(
    (set) => ({
      openaiApiKey: '',
      baseCurrency: 'EGP',
      vfFeePercentage: 1.5,
      theme: 'dark',
      currencies: ['EGP', 'USD', 'EUR', 'SAR', 'AED'],
      exchangeRates: {},
      lastRateUpdate: null,
      privacyMode: false, // When true, blur/hide sensitive data
      notificationsEnabled: true, // Enable/disable notifications
      notificationPermission: 'default', // 'default', 'granted', 'denied'
      vatRate: 0, // VAT/GST rate percentage
      taxYear: new Date().getFullYear(), // Current tax year
      hasSeenOnboarding: false, // Track if user has seen onboarding slides
      
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
      setVfFeePercentage: (percentage) => set({ vfFeePercentage: percentage }),
      setTheme: (theme) => set({ theme }),
      setExchangeRates: (rates) => set({ 
        exchangeRates: rates, 
        lastRateUpdate: new Date().toISOString() 
      }),
      setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setNotificationPermission: (permission) => set({ notificationPermission: permission }),
      setVatRate: (rate) => set({ vatRate: rate }),
      setTaxYear: (year) => set({ taxYear: year }),
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
    }),
    {
      name: 'media-buyer-settings',
    }
  )
);

// Main data store
export const useDataStore = create((set, get) => ({
  // Data
  clients: [],
  income: [],
  expenses: [],
  debts: [],
  goals: [],
  invoices: [],
  todos: [],
  lists: [],
  savings: [],
  savingsTransactions: [],
  openingBalances: [],
  expectedIncome: [],
  
  // Loading states
  isLoading: false,
  error: null,
  
  // Processing lock for recurring expenses
  isProcessingRecurring: false,
  
  // Sync state
  syncStatus: {
    isSyncing: false,
    lastSyncTime: null,
  },

  // Helper to sync to API (MongoDB) in background
  syncToAPI: async (entity, operation, data) => {
    try {
      // If user is not authenticated, skip cloud sync (local IndexedDB + file only)
      if (!authService.isAuthenticated()) {
        return null;
      }

      // Lazy load syncService to avoid circular deps / heavy imports on startup
      const syncServiceModule = await import('../services/sync/syncService.js');
      const syncService = syncServiceModule.default || syncServiceModule;

      const operationPayload = {
        entity,
        type: operation, // 'create' | 'update' | 'delete'
      };

      // Prefer mongoId (ObjectId string from server) if available, otherwise fall back to local id
      const itemId = data?.mongoId || data?._id || data?.id;

      if (operation === 'create') {
        operationPayload.data = data;
      } else if (operation === 'update') {
        if (!itemId) {
          // No server id yet – queue a full create instead on next full sync
          operationPayload.type = 'create';
          operationPayload.data = data;
        } else {
          operationPayload.id = itemId;
          operationPayload.data = data;
        }
      } else if (operation === 'delete') {
        if (!itemId) {
          // Nothing to delete on server if we don't know its id
          return null;
        }
        operationPayload.id = itemId;
      }

      // Queue operation and try to process immediately in background
      syncService.queueOperation(operationPayload);
      // Fire-and-forget processing; errors are handled inside syncService
      syncService.processQueue();

      return true;
    } catch (error) {
      // Never break the UI or local save because of sync issues
      console.error('syncToAPI error:', error);
      return null;
    }
  },

  // Auto-save current data snapshot to file (Electron/Capacitor only - disabled in browser)
  autoSaveToFile: async () => {
    try {
      // Check if we're in browser (not Electron or Capacitor)
      const isElectron = !!(window.electron || (typeof window !== 'undefined' && window.process && window.process.type === 'renderer'));
      const isCapacitor = !!(typeof window !== 'undefined' && window.Capacitor);
      const isBrowser = !isElectron && !isCapacitor;
      
      // In browser, skip auto-save to file (IndexedDB is enough)
      // Only save to file in Electron/Capacitor where we have file system access
      if (isBrowser) {
        // Silently skip - IndexedDB already has the data
        return;
      }
      
      const fileStorageModule = await import('../services/storage/fileStorage.js');
      const fileStorage = fileStorageModule.default || fileStorageModule;

      const state = get();
      const data = {
        clients: state.clients,
        income: state.income,
        expenses: state.expenses,
        debts: state.debts,
        goals: state.goals,
        invoices: state.invoices,
        todos: state.todos,
        lists: state.lists,
        savings: state.savings,
        savingsTransactions: state.savingsTransactions,
        openingBalances: state.openingBalances,
        expectedIncome: state.expectedIncome,
      };

      await fileStorage.save(data);
    } catch (error) {
      console.error('Auto-save to file failed:', error);
    }
  },
  
  // Initialize data from IndexedDB
  initializeData: async () => {
    set({ isLoading: true, error: null });
    
    // Import fileStorage for auto-save
    const fileStorage = (await import('../services/storage/fileStorage.js')).default;
    try {
      const [clients, income, expenses, debts, goals, invoices, todos, lists, savings, savingsTransactions, openingBalances, expectedIncome] = await Promise.all([
        clientsDB.getAll().catch(() => []),
        incomeDB.getAll().catch(() => []),
        expensesDB.getAll().catch(() => []),
        debtsDB.getAll().catch(() => []),
        goalsDB.getAll().catch(() => []),
        invoicesDB.getAll().catch(() => []),
        todosDB.getAll().catch(() => []),
        listsDB.getAll().catch(() => []),
        savingsDB.getAll().catch(() => []),
        savingsTransactionsDB.getAll().catch(() => []),
        openingBalancesDB.getAll().catch(() => []),
        expectedIncomeDB.getAll().catch(() => []),
      ]);
      
      // If no lists exist, create a default list
      if (lists.length === 0) {
        const defaultListId = await listsDB.add({
          name: 'Default',
          color: 'indigo',
        });
        const defaultList = { id: defaultListId, name: 'Default', color: 'indigo' };
        lists.push(defaultList);
      }
      
      set({ clients, income, expenses, debts, goals, invoices, todos, lists, savings, savingsTransactions, openingBalances, expectedIncome, isLoading: false });
    } catch (error) {
      console.error('Database initialization error:', error);
      set({ error: error.message, isLoading: false });
      // Set empty arrays as fallback
      set({ clients: [], income: [], expenses: [], debts: [], goals: [], invoices: [], todos: [], lists: [], savings: [], savingsTransactions: [], expectedIncome: [], isLoading: false });
    }
  },
  
  // Client operations
  addClient: async (client) => {
    try {
      const id = await clientsDB.add(client);
      const newClient = { ...client, id };
      set((state) => ({ clients: [...state.clients, newClient] }));

      // Sync to cloud (background) and auto-save to file
      get().syncToAPI('client', 'create', newClient);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateClient: async (id, changes) => {
    try {
      await clientsDB.update(id, changes);
      const existing = get().clients.find((c) => c.id === id);
      const updated = { ...existing, ...changes, id };

      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updated : c)),
      }));

      // Sync to cloud
      get().syncToAPI('client', 'update', updated);
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      const existing = get().clients.find((c) => c.id === id);
      await clientsDB.delete(id);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
      }));
      
      // Sync delete to cloud (if we know about it)
      if (existing) {
        get().syncToAPI('client', 'delete', existing);
      }
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Income operations
  addIncome: async (income) => {
    try {
      const id = await incomeDB.add(income);
      const newIncome = { ...income, id };
      set((state) => ({ income: [newIncome, ...state.income] }));

      // Sync to cloud
      get().syncToAPI('income', 'create', newIncome);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateIncome: async (id, changes) => {
    try {
      await incomeDB.update(id, changes);
      // Get the full income object to include mongoId for syncing
      const income = get().income.find((i) => i.id === id) || {};
      const updated = { ...income, ...changes, id };
      set((state) => ({
        income: state.income.map((i) => (i.id === id ? updated : i)),
      }));

      // Sync to cloud
      get().syncToAPI('income', 'update', updated);
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteIncome: async (id) => {
    try {
      const existing = get().income.find((i) => i.id === id);
      await incomeDB.delete(id);
      set((state) => ({
        income: state.income.filter((i) => i.id !== id),
      }));
      
      if (existing) {
        get().syncToAPI('income', 'delete', existing);
      }
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Expense operations
  addExpense: async (expense) => {
    try {
      const id = await expensesDB.add(expense);
      const newExpense = { ...expense, id };
      set((state) => ({ expenses: [newExpense, ...state.expenses] }));

      // Sync to cloud
      get().syncToAPI('expense', 'create', newExpense);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateExpense: async (id, changes) => {
    try {
      await expensesDB.update(id, changes);
      // Get the full expense object to include mongoId for syncing
      const expense = get().expenses.find((e) => e.id === id) || {};
      const updated = { ...expense, ...changes, id };
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      }));

      // Sync to cloud
      get().syncToAPI('expense', 'update', updated);
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteExpense: async (id) => {
    try {
      const existing = get().expenses.find((e) => e.id === id);
      await expensesDB.delete(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
      
      if (existing) {
        get().syncToAPI('expense', 'delete', existing);
      }
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Clean up duplicate expenses (especially from recurring expenses)
  cleanupDuplicateExpenses: async () => {
    try {
      const allExpenses = await expensesDB.getAll();
      const duplicates = new Map();
      const toDelete = new Set();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);
      
      // First, check for duplicates from recurring expenses (same parentRecurringId and same month)
      const recurringDuplicates = new Map();
      allExpenses.forEach((expense) => {
        if (expense.parentRecurringId) {
          const expenseDate = new Date(expense.date);
          const yearMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
          const key = `${expense.parentRecurringId}_${yearMonth}`;
          
          if (!recurringDuplicates.has(key)) {
            recurringDuplicates.set(key, []);
          }
          recurringDuplicates.get(key).push(expense);
        }
      });
      
      // Mark duplicates from recurring expenses for deletion (keep the oldest)
      recurringDuplicates.forEach((expenseGroup) => {
        if (expenseGroup.length > 1) {
          expenseGroup.sort((a, b) => a.id - b.id);
          for (let i = 1; i < expenseGroup.length; i++) {
            toDelete.add(expenseGroup[i].id);
          }
        }
      });
      
      // Also check for exact duplicates (same description, amount, date)
      allExpenses.forEach((expense) => {
        const key = `${expense.description || ''}_${expense.amount}_${expense.date}`;
        
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key).push(expense);
      });
      
      // Find exact duplicates (more than 1 expense with same key)
      duplicates.forEach((expenseGroup) => {
        if (expenseGroup.length > 1) {
          // Sort by ID (keep the oldest one, delete the rest)
          expenseGroup.sort((a, b) => a.id - b.id);
          // Keep the first one, mark the rest for deletion (if not already marked)
          for (let i = 1; i < expenseGroup.length; i++) {
            toDelete.add(expenseGroup[i].id);
          }
        }
      });
      
      // Also remove expenses with future dates in the current month (created too early)
      allExpenses.forEach((expense) => {
        if (expense.parentRecurringId) {
          const expenseDate = new Date(expense.date);
          expenseDate.setHours(0, 0, 0, 0);
          const expenseYear = expenseDate.getFullYear();
          const expenseMonth = expenseDate.getMonth();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          
          // If it's in the current month but the date is in the future, delete it
          if (expenseYear === currentYear && expenseMonth === currentMonth && expenseDate.getTime() > today.getTime()) {
            toDelete.add(expense.id);
          }
        }
      });
      
      // Delete duplicates
      let deletedCount = 0;
      for (const id of toDelete) {
        await expensesDB.delete(id);
        deletedCount++;
      }
      
      // Refresh expenses
      if (deletedCount > 0) {
        const updatedExpenses = await expensesDB.getAll();
        set({ expenses: updatedExpenses });
        console.log(`Cleaned up ${deletedCount} duplicate expense(s)`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up duplicate expenses:', error);
      return 0;
    }
  },
  
  // Process recurring expenses - automatically create monthly entries
  processRecurringExpenses: async () => {
    // Prevent concurrent execution
    if (get().isProcessingRecurring) {
      console.log('Recurring expenses processing already in progress, skipping...');
      return 0;
    }
    
    try {
      set({ isProcessingRecurring: true });
      
      // Get fresh data from database to avoid stale state
      const allExpenses = await expensesDB.getAll();
      const recurringExpenses = allExpenses.filter((e) => e.isRecurring && !e.parentRecurringId);
      
      if (recurringExpenses.length === 0) {
        set({ isProcessingRecurring: false });
        return 0;
      }
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      let createdCount = 0;
      const expensesToAdd = [];
      
      for (const recurringExpense of recurringExpenses) {
        // Parse date string (YYYY-MM-DD) to avoid timezone issues
        const dateParts = recurringExpense.date.split('-');
        const originalYear = parseInt(dateParts[0], 10);
        const originalMonth = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const dayOfMonth = parseInt(dateParts[2], 10);
        
        // Calculate the target date for this month based on the day of month from original date
        // Handle edge case: if day doesn't exist in target month (e.g., Jan 31 -> Feb), use last day of month
        let targetDate = new Date(currentYear, currentMonth, dayOfMonth);
        if (targetDate.getDate() !== dayOfMonth) {
          // Day doesn't exist in this month, use last day of month
          targetDate = new Date(currentYear, currentMonth + 1, 0);
        }
        
        // Normalize dates to start of day for accurate comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        today.setHours(0, 0, 0, 0);
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        targetDateOnly.setHours(0, 0, 0, 0);
        
        // Check if target date is in the current month
        const isTargetInCurrentMonth = targetDate.getFullYear() === currentYear && targetDate.getMonth() === currentMonth;
        
        // Check if the original expense date is in the current month (to avoid creating duplicate of the original)
        const isOriginalInCurrentMonth = originalYear === currentYear && originalMonth === currentMonth;
        
        // Only create if:
        // 1. Target date is in the current month
        // 2. Target date is today or has passed (to catch up if app wasn't open on the exact day)
        // 3. The original expense date is NOT in the current month (to avoid creating duplicate of the original)
        // This ensures expenses are created on the correct day of month, and catches up if missed
        const isTargetDateTodayOrPast = targetDateOnly.getTime() <= today.getTime();
        const shouldCreate = isTargetInCurrentMonth && isTargetDateTodayOrPast && !isOriginalInCurrentMonth;
        
        if (shouldCreate) {
          // Format date as YYYY-MM-DD without timezone issues
          const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          
          // Check if an expense already exists for this month - query database directly
          const existingExpense = allExpenses.find((e) => {
            // Check by parentRecurringId first (most reliable)
            if (e.parentRecurringId === recurringExpense.id) {
              const expenseDate = new Date(e.date);
              const expenseYearMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
              const targetYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
              return expenseYearMonth === targetYearMonth;
            }
            
            // Also check if the original recurring expense itself is in this month
            if (e.id === recurringExpense.id) {
              const expenseDate = new Date(e.date);
              const expenseYearMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
              const targetYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
              return expenseYearMonth === targetYearMonth;
            }
            
            // Additional check: same description, amount, and date (to catch any duplicates)
            if (e.description === recurringExpense.description &&
                e.amount === recurringExpense.amount &&
                e.date === targetDateStr) {
              return true;
            }
            
            return false;
          });
          
          if (!existingExpense) {
            // Create new expense for this month
            const newExpense = {
              clientId: recurringExpense.clientId,
              amount: recurringExpense.amount,
              currency: recurringExpense.currency,
              category: recurringExpense.category,
              description: recurringExpense.description || '',
              date: targetDateStr,
              isRecurring: false, // The generated expense is not recurring itself
              notes: recurringExpense.notes || '',
              taxCategory: recurringExpense.taxCategory || null,
              isTaxDeductible: recurringExpense.isTaxDeductible || false,
              taxRate: recurringExpense.taxRate || null,
              parentRecurringId: recurringExpense.id, // Track which recurring expense created this
            };
            
            expensesToAdd.push(newExpense);
          }
        }
      }
      
      // Add all expenses at once, then refresh
      for (const expense of expensesToAdd) {
        await expensesDB.add(expense);
        createdCount++;
      }
      
      // Refresh expenses from database
      if (createdCount > 0) {
        const updatedExpenses = await expensesDB.getAll();
        set({ expenses: updatedExpenses });
        console.log(`Auto-created ${createdCount} recurring expense(s) for this month`);
      }
      
      // Clean up any duplicates that might have been created
      await get().cleanupDuplicateExpenses();
      
      set({ isProcessingRecurring: false });
      return createdCount;
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
      set({ error: error.message, isProcessingRecurring: false });
      return 0;
    }
  },
  
  // Debt operations
  addDebt: async (debt) => {
    try {
      const id = await debtsDB.add(debt);
      const newDebt = { ...debt, id };
      set((state) => ({ debts: [...state.debts, newDebt] }));

      // Sync to cloud
      get().syncToAPI('debt', 'create', newDebt);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateDebt: async (id, changes) => {
    try {
      await debtsDB.update(id, changes);
      // Get the full debt object to include mongoId for syncing
      const debt = get().debts.find((d) => d.id === id) || {};
      const updated = { ...debt, ...changes, id };
      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? updated : d)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('debt', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteDebt: async (id) => {
    try {
      const debt = get().debts.find((d) => d.id === id);
      await debtsDB.delete(id);
      set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
      }));
      
      // Sync to API in background
      if (debt) {
        get().syncToAPI('debt', 'delete', debt);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Goals operations
  addGoal: async (goal) => {
    try {
      const id = await goalsDB.add(goal);
      const newGoal = { ...goal, id, currentAmount: 0 };
      set((state) => ({ goals: [...state.goals, newGoal] }));

      // Sync to cloud
      get().syncToAPI('goal', 'create', newGoal);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateGoal: async (id, changes) => {
    try {
      await goalsDB.update(id, changes);
      // Get the full goal object to include mongoId for syncing
      const goal = get().goals.find((g) => g.id === id) || {};
      const updated = { ...goal, ...changes, id };
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('goal', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteGoal: async (id) => {
    try {
      const goal = get().goals.find((g) => g.id === id);
      await goalsDB.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
      
      // Sync to API in background
      if (goal) {
        get().syncToAPI('goal', 'delete', goal);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateGoalProgress: async (id, currentAmount) => {
    try {
      await goalsDB.update(id, { currentAmount });
      const goal = get().goals.find((g) => g.id === id) || {};
      const updated = { ...goal, currentAmount, id };
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      
      get().syncToAPI('goal', 'update', updated);
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Invoice operations
  addInvoice: async (invoice) => {
    try {
      // Generate invoice number if not provided
      if (!invoice.invoiceNumber) {
        invoice.invoiceNumber = await invoicesDB.getNextInvoiceNumber();
      }
      const id = await invoicesDB.add(invoice);
      const newInvoice = { ...invoice, id };
      set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
      
      // Sync to API in background and update with mongoId from server response
      get().syncToAPI('invoice', 'create', newInvoice);
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateInvoice: async (id, changes) => {
    try {
      await invoicesDB.update(id, changes);
      // Get the full invoice object to include mongoId for syncing
      const invoice = get().invoices.find((inv) => inv.id === id) || {};
      const updated = { ...invoice, ...changes, id };
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? updated : inv)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('invoice', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteInvoice: async (id) => {
    try {
      const invoice = get().invoices.find((inv) => inv.id === id);
      await invoicesDB.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
      
      // Sync to API in background
      if (invoice) {
        get().syncToAPI('invoice', 'delete', invoice);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Todo operations
  addTodo: async (todo) => {
    try {
      const id = await todosDB.add(todo);
      const newTodo = { ...todo, id };
      set((state) => ({ todos: [...state.todos, newTodo] }));

      // Sync to cloud
      get().syncToAPI('todo', 'create', newTodo);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateTodo: async (id, changes) => {
    try {
      await todosDB.update(id, changes);
      // Get the full todo object to include mongoId for syncing
      const todo = get().todos.find((t) => t.id === id) || {};
      const updated = { ...todo, ...changes, id };
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('todo', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteTodo: async (id) => {
    try {
      const todo = get().todos.find((t) => t.id === id);
      await todosDB.delete(id);
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
      }));
      
      // Sync to API in background
      if (todo) {
        get().syncToAPI('todo', 'delete', todo);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  toggleTodoComplete: async (id) => {
    try {
      const todo = get().todos.find((t) => t.id === id);
      if (!todo) return;
      
      const newCompleted = !todo.completed;
      await todosDB.update(id, { completed: newCompleted });
      
      // If it's a recurring task and being completed, create next instance
      if (newCompleted && todo.isRecurring && todo.recurrencePattern) {
        const nextDueDate = calculateNextDueDate(todo.dueDate, todo.recurrencePattern);
        const nextTodo = {
          listId: todo.listId,
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          category: todo.category,
          dueDate: nextDueDate,
          completed: false,
          isRecurring: true,
          recurrencePattern: todo.recurrencePattern,
        };
        await get().addTodo(nextTodo);
      }
      
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
      }));
      
      get().syncToAPI('todo', 'update', { ...todo, completed: newCompleted, id });
      
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // List operations
  addList: async (list) => {
    try {
      const id = await listsDB.add(list);
      const newList = { ...list, id };
      set((state) => ({ lists: [...state.lists, newList] }));

      // Sync to cloud
      get().syncToAPI('list', 'create', newList);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateList: async (id, changes) => {
    try {
      await listsDB.update(id, changes);
      // Get the full list object to include mongoId for syncing
      const list = get().lists.find((l) => l.id === id) || {};
      const updated = { ...list, ...changes, id };
      set((state) => ({
        lists: state.lists.map((l) => (l.id === id ? updated : l)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('list', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteList: async (id) => {
    try {
      const list = get().lists.find((l) => l.id === id);
      await listsDB.delete(id);
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
      }));
      
      // Sync to API in background
      if (list) {
        get().syncToAPI('list', 'delete', list);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Savings operations
  addSavings: async (savings) => {
    try {
      const id = await savingsDB.add(savings);
      const newSavings = { ...savings, id };
      set((state) => ({ savings: [...state.savings, newSavings] }));

      // Sync to cloud
      get().syncToAPI('saving', 'create', newSavings);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateSavings: async (id, changes) => {
    try {
      await savingsDB.update(id, changes);
      // Get the full saving object to include mongoId for syncing
      const saving = get().savings.find((s) => s.id === id) || {};
      const updated = { ...saving, ...changes, id };
      set((state) => ({
        savings: state.savings.map((s) => (s.id === id ? updated : s)),
      }));
      
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('saving', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteSavings: async (id) => {
    try {
      const saving = get().savings.find((s) => s.id === id);
      await savingsDB.delete(id);
      set((state) => ({
        savings: state.savings.filter((s) => s.id !== id),
        savingsTransactions: state.savingsTransactions.filter((t) => t.savingsId !== id),
      }));
      
      // Sync to API in background
      if (saving) {
        get().syncToAPI('saving', 'delete', saving);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  addSavingsTransaction: async (transaction) => {
    try {
      const id = await savingsTransactionsDB.add(transaction);
      const newTransaction = { ...transaction, id };
      set((state) => ({ savingsTransactions: [...state.savingsTransactions, newTransaction] }));
      
      // Update savings current amount based on transaction
      const savings = get().savings.find((s) => s.id === transaction.savingsId);
      if (savings) {
        let newAmount = savings.currentAmount || savings.initialAmount || 0;
        if (transaction.type === 'deposit') {
          newAmount += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          newAmount -= transaction.amount;
        } else if (transaction.type === 'value_update') {
          // For gold/stocks, calculate from quantity and price
          if (transaction.quantity && transaction.pricePerUnit) {
            newAmount = transaction.quantity * transaction.pricePerUnit;
          } else {
            newAmount = transaction.amount;
          }
        }
        
        await get().updateSavings(transaction.savingsId, { 
          currentAmount: newAmount,
          pricePerUnit: transaction.pricePerUnit || savings.pricePerUnit,
          quantity: transaction.quantity || savings.quantity,
        });
      }
      
      // Sync to cloud
      get().syncToAPI('savingsTransaction', 'create', newTransaction);

      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateSavingsTransaction: async (id, changes) => {
    try {
      await savingsTransactionsDB.update(id, changes);
      const transaction = get().savingsTransactions.find((t) => t.id === id) || {};
      const updated = { id, ...transaction, ...changes };
      
      set((state) => ({
        savingsTransactions: state.savingsTransactions.map((t) => (t.id === id ? { ...t, ...changes } : t)),
      }));
      
      // Recalculate savings amount if transaction changed
      if (changes.amount || changes.type || changes.quantity || changes.pricePerUnit) {
        const savings = get().savings.find((s) => s.id === transaction.savingsId);
        if (savings) {
          // Recalculate from all transactions
          const allTransactions = get().savingsTransactions.filter((t) => t.savingsId === savings.id);
          let newAmount = savings.initialAmount || 0;
          
          allTransactions.forEach((t) => {
            if (t.type === 'deposit') {
              newAmount += t.amount;
            } else if (t.type === 'withdrawal') {
              newAmount -= t.amount;
            } else if (t.type === 'value_update') {
              if (t.quantity && t.pricePerUnit) {
                newAmount = t.quantity * t.pricePerUnit;
              } else {
                newAmount = t.amount;
              }
            }
          });
          
          await get().updateSavings(savings.id, { 
            currentAmount: newAmount,
            pricePerUnit: changes.pricePerUnit !== undefined ? changes.pricePerUnit : savings.pricePerUnit,
            quantity: changes.quantity !== undefined ? changes.quantity : savings.quantity,
          });
        }
      }
      
      // Sync to API in background
      get().syncToAPI('savingsTransaction', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteSavingsTransaction: async (id) => {
    try {
      const transaction = get().savingsTransactions.find((t) => t.id === id) || null;
      await savingsTransactionsDB.delete(id);
      set((state) => ({
        savingsTransactions: state.savingsTransactions.filter((t) => t.id !== id),
      }));
      
      // Recalculate savings amount
      if (transaction) {
        const savings = get().savings.find((s) => s.id === transaction.savingsId);
        if (savings) {
          const allTransactions = get().savingsTransactions.filter((t) => t.savingsId === savings.id && t.id !== id);
          let newAmount = savings.initialAmount || 0;
          
          allTransactions.forEach((t) => {
            if (t.type === 'deposit') {
              newAmount += t.amount;
            } else if (t.type === 'withdrawal') {
              newAmount -= t.amount;
            } else if (t.type === 'value_update') {
              if (t.quantity && t.pricePerUnit) {
                newAmount = t.quantity * t.pricePerUnit;
              } else {
                newAmount = t.amount;
              }
            }
          });
          
          await get().updateSavings(savings.id, { currentAmount: newAmount });
        }
      }
      
      // Sync to API in background
      if (transaction) {
        get().syncToAPI('savingsTransaction', 'delete', transaction);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateSavingsValue: async (id, currentAmount, pricePerUnit) => {
    try {
      const updates = { currentAmount };
      if (pricePerUnit !== undefined) {
        updates.pricePerUnit = pricePerUnit;
      }
      await get().updateSavings(id, updates);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Computed values
  getClientById: (id) => {
    return get().clients.find((c) => c.id === id);
  },
  
  getIncomeByClient: (clientId) => {
    return get().income.filter((i) => i.clientId === clientId);
  },
  
  getExpensesByClient: (clientId) => {
    return get().expenses.filter((e) => e.clientId === clientId);
  },
  
  getTotalIncomeByMonth: (year, month) => {
    const income = get().income;
    return income
      .filter((i) => {
        const date = new Date(i.receivedDate);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .reduce((sum, i) => sum + (i.netAmount || i.amount), 0);
  },
  
  getTotalExpensesByMonth: (year, month) => {
    const expenses = get().expenses;
    return expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  },
  
  // Opening Balance operations
  addOpeningBalance: async (balance) => {
    try {
      const id = await openingBalancesDB.upsert(balance);
      const updatedBalances = await openingBalancesDB.getAll();
      set({ openingBalances: updatedBalances });
      
      // Find the just-upserted balance to sync
      const savedBalance = updatedBalances.find((b) => b.id === id) || balance;
      get().syncToAPI('openingBalance', 'update', savedBalance);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateOpeningBalance: async (id, changes) => {
    try {
      await openingBalancesDB.update(id, changes);
      const updatedBalances = await openingBalancesDB.getAll();
      set({ openingBalances: updatedBalances });
      
      // Get the full opening balance object to include mongoId for syncing
      const balance = updatedBalances.find((b) => b.id === id);
      const updated = { ...balance, ...changes, id };
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('openingBalance', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteOpeningBalance: async (id) => {
    try {
      const balance = get().openingBalances.find((b) => b.id === id);
      await openingBalancesDB.delete(id);
      set((state) => ({
        openingBalances: state.openingBalances.filter((b) => b.id !== id),
      }));
      
      // Sync to API in background
      if (balance) {
        get().syncToAPI('openingBalance', 'delete', balance);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  getOpeningBalance: (periodType, period) => {
    return get().openingBalances.find(
      (b) => b.periodType === periodType && b.period === period
    );
  },
  
  // Expected Income operations
  addExpectedIncome: async (expectedIncome) => {
    try {
      const id = await expectedIncomeDB.upsert(expectedIncome);
      const updatedExpectedIncome = await expectedIncomeDB.getAll();
      set({ expectedIncome: updatedExpectedIncome });
      
      const saved = updatedExpectedIncome.find((ei) => ei.id === id) || expectedIncome;
      get().syncToAPI('expectedIncome', 'update', saved);
      
      // Auto-save to file
      get().autoSaveToFile();
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateExpectedIncome: async (id, changes) => {
    try {
      await expectedIncomeDB.update(id, changes);
      const updatedExpectedIncome = await expectedIncomeDB.getAll();
      set({ expectedIncome: updatedExpectedIncome });
      
      // Get the full expected income object to include mongoId for syncing
      const expectedIncome = updatedExpectedIncome.find((ei) => ei.id === id);
      const updated = { ...expectedIncome, ...changes, id };
      // Sync to API in background (includes mongoId if available)
      get().syncToAPI('expectedIncome', 'update', updated);
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteExpectedIncome: async (id) => {
    try {
      const existing = get().expectedIncome.find((ei) => ei.id === id);
      await expectedIncomeDB.delete(id);
      set((state) => ({
        expectedIncome: state.expectedIncome.filter((ei) => ei.id !== id),
      }));
      
      // Sync to API in background
      if (existing) {
        get().syncToAPI('expectedIncome', 'delete', existing);
      }
      // Auto-save to file
      get().autoSaveToFile();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  getExpectedIncomeByPeriod: (period) => {
    return get().expectedIncome.filter((ei) => ei.period === period);
  },
  
  getExpectedIncomeByClient: (clientId) => {
    return get().expectedIncome.filter((ei) => ei.clientId === clientId);
  },
}));

// Helper function to calculate next due date for recurring tasks
function calculateNextDueDate(currentDueDate, pattern) {
  const date = new Date(currentDueDate);
  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return currentDueDate;
  }
  return date.toISOString().split('T')[0];
}

// UI store for modals, sidebar, etc.
// Initialize sidebar state based on screen size
const getInitialSidebarState = () => {
  if (typeof window !== 'undefined') {
    // On mobile (small screens), start closed
    // On desktop (large screens), start open
    return window.innerWidth >= 1024; // lg breakpoint
  }
  return true; // Default to open for SSR
};

export const useUIStore = create((set) => ({
  sidebarOpen: getInitialSidebarState(), // Open on desktop, closed on mobile
  sidebarMinimized: false, // Desktop minimized state
  activeModal: null,
  modalData: null,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarMinimized: () => set((state) => ({ sidebarMinimized: !state.sidebarMinimized })),
  setSidebarMinimized: (minimized) => set({ sidebarMinimized: minimized }),
  
  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

