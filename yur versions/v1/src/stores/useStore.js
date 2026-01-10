import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clientsDB, incomeDB, expensesDB, debtsDB, goalsDB, invoicesDB, todosDB, listsDB, savingsDB, savingsTransactionsDB } from '../services/db/database';

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
  
  // Loading states
  isLoading: false,
  error: null,
  
  // Initialize data from IndexedDB
  initializeData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [clients, income, expenses, debts, goals, invoices, todos, lists, savings, savingsTransactions] = await Promise.all([
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
      
      set({ clients, income, expenses, debts, goals, invoices, todos, lists, savings, savingsTransactions, isLoading: false });
    } catch (error) {
      console.error('Database initialization error:', error);
      set({ error: error.message, isLoading: false });
      // Set empty arrays as fallback
      set({ clients: [], income: [], expenses: [], debts: [], goals: [], invoices: [], todos: [], lists: [], savings: [], savingsTransactions: [], isLoading: false });
    }
  },
  
  // Client operations
  addClient: async (client) => {
    try {
      const id = await clientsDB.add(client);
      const newClient = { ...client, id };
      set((state) => ({ clients: [...state.clients, newClient] }));
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateClient: async (id, changes) => {
    try {
      await clientsDB.update(id, changes);
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...changes } : c)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      await clientsDB.delete(id);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateIncome: async (id, changes) => {
    try {
      await incomeDB.update(id, changes);
      set((state) => ({
        income: state.income.map((i) => (i.id === id ? { ...i, ...changes } : i)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteIncome: async (id) => {
    try {
      await incomeDB.delete(id);
      set((state) => ({
        income: state.income.filter((i) => i.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateExpense: async (id, changes) => {
    try {
      await expensesDB.update(id, changes);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...changes } : e)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteExpense: async (id) => {
    try {
      await expensesDB.delete(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  // Debt operations
  addDebt: async (debt) => {
    try {
      const id = await debtsDB.add(debt);
      const newDebt = { ...debt, id };
      set((state) => ({ debts: [...state.debts, newDebt] }));
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateDebt: async (id, changes) => {
    try {
      await debtsDB.update(id, changes);
      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? { ...d, ...changes } : d)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteDebt: async (id) => {
    try {
      await debtsDB.delete(id);
      set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateGoal: async (id, changes) => {
    try {
      await goalsDB.update(id, changes);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteGoal: async (id) => {
    try {
      await goalsDB.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateGoalProgress: async (id, currentAmount) => {
    try {
      await goalsDB.update(id, { currentAmount });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount } : g)),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateInvoice: async (id, changes) => {
    try {
      await invoicesDB.update(id, changes);
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...changes } : inv)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteInvoice: async (id) => {
    try {
      await invoicesDB.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateTodo: async (id, changes) => {
    try {
      await todosDB.update(id, changes);
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? { ...t, ...changes } : t)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteTodo: async (id) => {
    try {
      await todosDB.delete(id);
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateList: async (id, changes) => {
    try {
      await listsDB.update(id, changes);
      set((state) => ({
        lists: state.lists.map((l) => (l.id === id ? { ...l, ...changes } : l)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteList: async (id) => {
    try {
      await listsDB.delete(id);
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
      }));
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
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateSavings: async (id, changes) => {
    try {
      await savingsDB.update(id, changes);
      set((state) => ({
        savings: state.savings.map((s) => (s.id === id ? { ...s, ...changes } : s)),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteSavings: async (id) => {
    try {
      await savingsDB.delete(id);
      set((state) => ({
        savings: state.savings.filter((s) => s.id !== id),
        savingsTransactions: state.savingsTransactions.filter((t) => t.savingsId !== id),
      }));
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
      
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateSavingsTransaction: async (id, changes) => {
    try {
      await savingsTransactionsDB.update(id, changes);
      const transaction = get().savingsTransactions.find((t) => t.id === id);
      const oldTransaction = { ...transaction };
      
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
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteSavingsTransaction: async (id) => {
    try {
      const transaction = get().savingsTransactions.find((t) => t.id === id);
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
export const useUIStore = create((set) => ({
  sidebarOpen: true,
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

