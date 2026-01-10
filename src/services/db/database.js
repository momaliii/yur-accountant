import Dexie from 'dexie';

export const db = new Dexie('MediaBuyerDashboard');

db.version(1).stores({
  clients: '++id, name, email, paymentModel, currency, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
});

// Migration to add rating and riskLevel to existing clients
// Note: Dexie requires all stores to be defined in each version
db.version(2).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
}).upgrade(async (tx) => {
  // Add default rating and riskLevel to existing clients
  await tx.clients.toCollection().modify((client) => {
    if (client.rating === undefined) client.rating = 3;
    if (!client.riskLevel) client.riskLevel = 'medium';
  });
});

// Migration to add deposit field to income
db.version(3).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
}).upgrade(async (tx) => {
  // Add default isDeposit = false to existing income entries
  await tx.income.toCollection().modify((income) => {
    if (income.isDeposit === undefined) income.isDeposit = false;
  });
});

// Migration to add isFixedPortionOnly field
db.version(4).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
}).upgrade(async (tx) => {
  // Add default isFixedPortionOnly = false to existing income entries
  await tx.income.toCollection().modify((income) => {
    if (income.isFixedPortionOnly === undefined) income.isFixedPortionOnly = false;
  });
});

// Migration to add status field to clients
db.version(5).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
}).upgrade(async (tx) => {
  // Add default status = 'active' to existing clients
  await tx.clients.toCollection().modify((client) => {
    if (!client.status) client.status = 'active';
  });
});

// Migration to add goals table
db.version(6).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // No data migration needed for new table
});

// Migration to add tax fields to income and expenses
db.version(7).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // Add default tax fields to existing income entries
  await tx.income.toCollection().modify((income) => {
    if (!income.taxCategory) income.taxCategory = null;
    if (income.isTaxable === undefined) income.isTaxable = true;
    if (!income.taxRate) income.taxRate = null;
  });
  // Add default tax fields to existing expense entries
  await tx.expenses.toCollection().modify((expense) => {
    if (!expense.taxCategory) expense.taxCategory = null;
    if (expense.isTaxDeductible === undefined) expense.isTaxDeductible = false;
    if (!expense.taxRate) expense.taxRate = null;
  });
});

// Migration to add invoices table
db.version(8).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // No data migration needed for new table
  // Invoices table will be created automatically
});

// Migration to add todos table
db.version(9).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // No data migration needed for new table
  // Todos table will be created automatically
});

// Migration to add lists table and listId to todos
db.version(10).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // Create default list and assign existing todos to it
  const defaultListId = await tx.lists.add({
    name: 'Default',
    color: 'indigo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Assign all existing todos to the default list
  await tx.todos.toCollection().modify((todo) => {
    todo.listId = defaultListId;
  });
});

// Migration to add savings and savingsTransactions tables
db.version(11).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
  savings: '++id, name, type, currency, initialAmount, currentAmount, targetAmount, targetDate, interestRate, maturityDate, quantity, pricePerUnit, notes, createdAt, updatedAt',
  savingsTransactions: '++id, savingsId, type, amount, currency, date, pricePerUnit, quantity, notes, createdAt',
}).upgrade(async (tx) => {
  // No data migration needed for new tables
  // Savings tables will be created automatically
});

// Migration to add startDate to savings
db.version(12).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
  savings: '++id, name, type, currency, initialAmount, currentAmount, targetAmount, targetDate, interestRate, maturityDate, startDate, quantity, pricePerUnit, notes, createdAt, updatedAt',
  savingsTransactions: '++id, savingsId, type, amount, currency, date, pricePerUnit, quantity, notes, createdAt',
}).upgrade(async (tx) => {
  // Add default startDate to existing savings (use createdAt if available)
  await tx.savings.toCollection().modify((saving) => {
    if (!saving.startDate && saving.createdAt) {
      saving.startDate = saving.createdAt.split('T')[0];
    }
  });
});

// Migration to add parentRecurringId to expenses for tracking auto-generated recurring expenses
db.version(13).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, parentRecurringId, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
  savings: '++id, name, type, currency, initialAmount, currentAmount, targetAmount, targetDate, interestRate, maturityDate, startDate, quantity, pricePerUnit, notes, createdAt, updatedAt',
  savingsTransactions: '++id, savingsId, type, amount, currency, date, pricePerUnit, quantity, notes, createdAt',
}).upgrade(async (tx) => {
  // Add default parentRecurringId = null to existing expenses
  await tx.expenses.toCollection().modify((expense) => {
    if (expense.parentRecurringId === undefined) {
      expense.parentRecurringId = null;
    }
  });
});

// Migration to add openingBalances table for monthly/yearly opening balances
db.version(14).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, parentRecurringId, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
  savings: '++id, name, type, currency, initialAmount, currentAmount, targetAmount, targetDate, interestRate, maturityDate, startDate, quantity, pricePerUnit, notes, createdAt, updatedAt',
  savingsTransactions: '++id, savingsId, type, amount, currency, date, pricePerUnit, quantity, notes, createdAt',
  openingBalances: '++id, [periodType+period], periodType, period, amount, currency, notes, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // No data migration needed for new table
});

// Migration to add expectedIncome table for tracking expected payments from clients
db.version(15).stores({
  clients: '++id, name, email, paymentModel, currency, rating, riskLevel, status, createdAt',
  income: '++id, clientId, amount, currency, paymentMethod, receivedDate, isDeposit, isFixedPortionOnly, taxCategory, isTaxable, taxRate, createdAt',
  expenses: '++id, clientId, amount, currency, category, date, isRecurring, taxCategory, isTaxDeductible, taxRate, parentRecurringId, createdAt',
  debts: '++id, type, partyName, amount, currency, dueDate, status, createdAt',
  goals: '++id, type, targetAmount, currentAmount, period, periodValue, category, createdAt, updatedAt',
  invoices: '++id, clientId, invoiceNumber, amount, currency, issueDate, dueDate, status, items, notes, createdAt, updatedAt',
  todos: '++id, listId, title, description, priority, category, dueDate, completed, isRecurring, recurrencePattern, createdAt, updatedAt',
  lists: '++id, name, color, createdAt, updatedAt',
  savings: '++id, name, type, currency, initialAmount, currentAmount, targetAmount, targetDate, interestRate, maturityDate, startDate, quantity, pricePerUnit, notes, createdAt, updatedAt',
  savingsTransactions: '++id, savingsId, type, amount, currency, date, pricePerUnit, quantity, notes, createdAt',
  openingBalances: '++id, [periodType+period], periodType, period, amount, currency, notes, createdAt, updatedAt',
  expectedIncome: '++id, [clientId+period], clientId, period, expectedAmount, currency, notes, isPaid, createdAt, updatedAt',
}).upgrade(async (tx) => {
  // No data migration needed for new table
});

// Client operations
export const clientsDB = {
  async getAll() {
    return await db.clients.toArray();
  },
  
  async getById(id) {
    return await db.clients.get(id);
  },
  
  async add(client) {
    return await db.clients.add({
      ...client,
      createdAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.clients.update(id, changes);
  },
  
  async delete(id) {
    return await db.clients.delete(id);
  },
};

// Income operations
export const incomeDB = {
  async getAll() {
    return await db.income.orderBy('receivedDate').reverse().toArray();
  },
  
  async getByClient(clientId) {
    return await db.income.where('clientId').equals(clientId).toArray();
  },
  
  async getByDateRange(startDate, endDate) {
    return await db.income
      .where('receivedDate')
      .between(startDate, endDate, true, true)
      .toArray();
  },
  
  async add(income) {
    return await db.income.add({
      ...income,
      createdAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.income.update(id, changes);
  },
  
  async delete(id) {
    return await db.income.delete(id);
  },
};

// Expense operations
export const expensesDB = {
  async getAll() {
    return await db.expenses.orderBy('date').reverse().toArray();
  },
  
  async getByClient(clientId) {
    return await db.expenses.where('clientId').equals(clientId).toArray();
  },
  
  async getByDateRange(startDate, endDate) {
    return await db.expenses
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },
  
  async getRecurring() {
    return await db.expenses.where('isRecurring').equals(1).toArray();
  },
  
  async add(expense) {
    return await db.expenses.add({
      ...expense,
      createdAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.expenses.update(id, changes);
  },
  
  async delete(id) {
    return await db.expenses.delete(id);
  },
};

// Debt operations
export const debtsDB = {
  async getAll() {
    return await db.debts.orderBy('dueDate').toArray();
  },
  
  async getOwedToMe() {
    return await db.debts.where('type').equals('owed_to_me').toArray();
  },
  
  async getIOwe() {
    return await db.debts.where('type').equals('i_owe').toArray();
  },
  
  async add(debt) {
    return await db.debts.add({
      ...debt,
      createdAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.debts.update(id, changes);
  },
  
  async delete(id) {
    return await db.debts.delete(id);
  },
};

// Goals operations
export const goalsDB = {
  async getAll() {
    return await db.goals.toArray();
  },
  
  async getById(id) {
    return await db.goals.get(id);
  },
  
  async getByType(type) {
    return await db.goals.where('type').equals(type).toArray();
  },
  
  async add(goal) {
    return await db.goals.add({
      ...goal,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.goals.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async delete(id) {
    return await db.goals.delete(id);
  },
};

// Invoice operations
export const invoicesDB = {
  async getAll() {
    return await db.invoices.orderBy('issueDate').reverse().toArray();
  },
  
  async getById(id) {
    return await db.invoices.get(id);
  },
  
  async getByClient(clientId) {
    return await db.invoices.where('clientId').equals(clientId).orderBy('issueDate').reverse().toArray();
  },
  
  async getByStatus(status) {
    return await db.invoices.where('status').equals(status).toArray();
  },
  
  async getNextInvoiceNumber() {
    const invoices = await db.invoices.orderBy('invoiceNumber').reverse().toArray();
    if (invoices.length === 0) {
      return 'INV-001';
    }
    const lastNumber = invoices[0].invoiceNumber;
    const match = lastNumber.match(/INV-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `INV-${String(nextNum).padStart(3, '0')}`;
    }
    return 'INV-001';
  },
  
  async add(invoice) {
    return await db.invoices.add({
      ...invoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.invoices.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async delete(id) {
    return await db.invoices.delete(id);
  },
};

// Todo operations
export const todosDB = {
  async getAll() {
    return await db.todos.orderBy('dueDate').toArray();
  },
  
  async getById(id) {
    return await db.todos.get(id);
  },
  
  async getByListId(listId) {
    return await db.todos.where('listId').equals(listId).toArray();
  },
  
  async getByCategory(category) {
    return await db.todos.where('category').equals(category).toArray();
  },
  
  async getByPriority(priority) {
    return await db.todos.where('priority').equals(priority).toArray();
  },
  
  async getCompleted() {
    return await db.todos.where('completed').equals(1).toArray();
  },
  
  async getPending() {
    return await db.todos.where('completed').equals(0).toArray();
  },
  
  async add(todo) {
    return await db.todos.add({
      ...todo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.todos.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async delete(id) {
    return await db.todos.delete(id);
  },
};

// List operations
export const listsDB = {
  async getAll() {
    return await db.lists.orderBy('createdAt').toArray();
  },
  
  async getById(id) {
    return await db.lists.get(id);
  },
  
  async add(list) {
    return await db.lists.add({
      ...list,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.lists.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async delete(id) {
    // First, delete all todos in this list or move them to default list
    const defaultList = await db.lists.where('name').equals('Default').first();
    if (defaultList) {
      await db.todos.where('listId').equals(id).modify({ listId: defaultList.id });
    } else {
      // If no default list, delete all todos in this list
      const todosInList = await db.todos.where('listId').equals(id).toArray();
      await Promise.all(todosInList.map(todo => db.todos.delete(todo.id)));
    }
    return await db.lists.delete(id);
  },
};

// Savings operations
export const savingsDB = {
  async getAll() {
    return await db.savings.orderBy('createdAt').reverse().toArray();
  },
  
  async getById(id) {
    return await db.savings.get(id);
  },
  
  async getByType(type) {
    return await db.savings.where('type').equals(type).toArray();
  },
  
  async add(savings) {
    return await db.savings.add({
      ...savings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.savings.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async delete(id) {
    // Delete all related transactions first
    await db.savingsTransactions.where('savingsId').equals(id).delete();
    return await db.savings.delete(id);
  },
};

// Savings Transactions operations
export const savingsTransactionsDB = {
  async getAll() {
    return await db.savingsTransactions.orderBy('date').reverse().toArray();
  },
  
  async getById(id) {
    return await db.savingsTransactions.get(id);
  },
  
  async getBySavingsId(savingsId) {
    return await db.savingsTransactions.where('savingsId').equals(savingsId).orderBy('date').reverse().toArray();
  },
  
  async getByType(type) {
    return await db.savingsTransactions.where('type').equals(type).toArray();
  },
  
  async add(transaction) {
    return await db.savingsTransactions.add({
      ...transaction,
      createdAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.savingsTransactions.update(id, changes);
  },
  
  async delete(id) {
    return await db.savingsTransactions.delete(id);
  },
};

// Opening Balance operations
export const openingBalancesDB = {
  async getAll() {
    return await db.openingBalances.orderBy('period').reverse().toArray();
  },
  
  async getById(id) {
    return await db.openingBalances.get(id);
  },
  
  async getByPeriod(periodType, period) {
    return await db.openingBalances
      .where('[periodType+period]')
      .equals([periodType, period])
      .first();
  },
  
  async getByPeriodType(periodType) {
    return await db.openingBalances
      .where('periodType')
      .equals(periodType)
      .orderBy('period')
      .reverse()
      .toArray();
  },
  
  async add(balance) {
    return await db.openingBalances.add({
      ...balance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.openingBalances.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async upsert(balance) {
    const existing = await this.getByPeriod(balance.periodType, balance.period);
    if (existing) {
      return await this.update(existing.id, balance);
    } else {
      return await this.add(balance);
    }
  },
  
  async delete(id) {
    return await db.openingBalances.delete(id);
  },
};

// Expected Income operations
export const expectedIncomeDB = {
  async getAll() {
    return await db.expectedIncome.orderBy('period').reverse().toArray();
  },
  
  async getById(id) {
    return await db.expectedIncome.get(id);
  },
  
  async getByPeriod(period) {
    return await db.expectedIncome.where('period').equals(period).toArray();
  },
  
  async getByClientAndPeriod(clientId, period) {
    return await db.expectedIncome
      .where('[clientId+period]')
      .equals([clientId, period])
      .first();
  },
  
  async getByClient(clientId) {
    return await db.expectedIncome.where('clientId').equals(clientId).toArray();
  },
  
  async add(expectedIncome) {
    return await db.expectedIncome.add({
      ...expectedIncome,
      isPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  
  async update(id, changes) {
    return await db.expectedIncome.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },
  
  async upsert(expectedIncome) {
    const existing = await this.getByClientAndPeriod(expectedIncome.clientId, expectedIncome.period);
    if (existing) {
      return await this.update(existing.id, expectedIncome);
    } else {
      return await this.add(expectedIncome);
    }
  },
  
  async delete(id) {
    return await db.expectedIncome.delete(id);
  },
  
  async deleteByPeriod(period) {
    return await db.expectedIncome.where('period').equals(period).delete();
  },
};

// Export/Import for backup
export const backupDB = {
  async exportAll() {
    const data = {
      clients: await db.clients.toArray(),
      income: await db.income.toArray(),
      expenses: await db.expenses.toArray(),
      debts: await db.debts.toArray(),
      goals: await db.goals.toArray(),
      invoices: await db.invoices.toArray(),
      todos: await db.todos.toArray(),
      lists: await db.lists.toArray(),
      savings: await db.savings.toArray(),
      savingsTransactions: await db.savingsTransactions.toArray(),
      openingBalances: await db.openingBalances.toArray(),
      expectedIncome: await db.expectedIncome.toArray(),
      exportedAt: new Date().toISOString(),
    };
    return data;
  },
  
  async importAll(data) {
    console.log('importAll called with data:', {
      hasClients: !!data.clients,
      clientsLength: data.clients?.length || 0,
      hasIncome: !!data.income,
      incomeLength: data.income?.length || 0,
      hasExpenses: !!data.expenses,
      expensesLength: data.expenses?.length || 0,
      dataKeys: Object.keys(data),
      fullData: data, // Log the full data to see what's actually there
    });
    
    // Check if data is actually an object with arrays
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format: data must be an object');
    }
    
    // Check if arrays exist and have length
    const hasData = (data.clients && data.clients.length > 0) ||
                    (data.income && data.income.length > 0) ||
                    (data.expenses && data.expenses.length > 0) ||
                    (data.debts && data.debts.length > 0) ||
                    (data.goals && data.goals.length > 0);
    
    if (!hasData) {
      console.error('No data to import! Data structure:', {
        clients: Array.isArray(data.clients) ? `Array(${data.clients.length})` : typeof data.clients,
        income: Array.isArray(data.income) ? `Array(${data.income.length})` : typeof data.income,
        expenses: Array.isArray(data.expenses) ? `Array(${data.expenses.length})` : typeof data.expenses,
        sampleKeys: Object.keys(data).slice(0, 10),
      });
      throw new Error('No data to import: all arrays are empty or missing');
    }
    
    // Helper function to create a numeric ID from MongoDB _id or string
    // We need consistent numeric IDs for bulkPut to work with ++id
    const createNumericId = (id) => {
      if (id === null || id === undefined) return undefined;
      
      // If it's already a number, use it
      if (typeof id === 'number') return id;
      
      // If it's a numeric string, convert to number
      if (typeof id === 'string' && !isNaN(Number(id)) && id.trim() !== '') {
        return Number(id);
      }
      
      // For MongoDB ObjectId strings, create a hash-based numeric ID
      // This ensures the same MongoDB _id always maps to the same IndexedDB id
      if (typeof id === 'string') {
        // Simple hash function to convert string to number
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          const char = id.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        // Make it positive and ensure it's within safe integer range
        return Math.abs(hash) % 2147483647; // Max safe integer for IndexedDB
      }
      
      // If it's an object (MongoDB ObjectId), convert to string first
      if (typeof id === 'object' && id.toString) {
        return createNumericId(id.toString());
      }
      
      return undefined;
    };
    
    // Helper function to transform document to IndexedDB format
    // Handles both MongoDB format (_id) and IndexedDB backup format (numeric id)
    const transformDoc = (doc) => {
      if (!doc) return doc;
      const transformed = { ...doc };
      
      // Store original MongoDB _id for reference
      let mongoId = null;
      if (transformed._id) {
        mongoId = typeof transformed._id === 'object' 
          ? transformed._id.toString() 
          : transformed._id;
        delete transformed._id;
      }
      
      // Transform _id to id (MongoDB uses _id, IndexedDB uses id)
      // Use numeric ID for IndexedDB compatibility with ++id
      if (mongoId) {
        transformed.id = createNumericId(mongoId);
        // Store original MongoDB _id as mongoId for reference
        transformed.mongoId = mongoId;
      } else if (transformed.id !== undefined) {
        // If id already exists (from backup), ensure it's a number
        transformed.id = createNumericId(transformed.id);
      }
      
      // Transform nested ObjectId references (clientId, listId, savingsId, etc.)
      // Handle both ObjectId objects and numeric IDs from backups
      // Keep numeric IDs as numbers for IndexedDB compatibility
      if (transformed.clientId !== null && transformed.clientId !== undefined) {
        if (typeof transformed.clientId === 'object' && transformed.clientId._id) {
          transformed.clientId = transformed.clientId._id.toString();
        } else if (typeof transformed.clientId === 'object') {
          transformed.clientId = transformed.clientId.toString();
        }
        // If it's a number (from backup), keep it as number
        // If it's a numeric string, convert to number for consistency
        else if (typeof transformed.clientId === 'string' && !isNaN(Number(transformed.clientId))) {
          transformed.clientId = Number(transformed.clientId);
        }
        // Otherwise keep as is (number or string)
      }
      
      if (transformed.listId !== null && transformed.listId !== undefined) {
        if (typeof transformed.listId === 'object' && transformed.listId._id) {
          transformed.listId = transformed.listId._id.toString();
        } else if (typeof transformed.listId === 'object') {
          transformed.listId = transformed.listId.toString();
        }
        else if (typeof transformed.listId === 'string' && !isNaN(Number(transformed.listId))) {
          transformed.listId = Number(transformed.listId);
        }
      }
      
      if (transformed.savingsId !== null && transformed.savingsId !== undefined) {
        if (typeof transformed.savingsId === 'object' && transformed.savingsId._id) {
          transformed.savingsId = transformed.savingsId._id.toString();
        } else if (typeof transformed.savingsId === 'object') {
          transformed.savingsId = transformed.savingsId.toString();
        }
        else if (typeof transformed.savingsId === 'string' && !isNaN(Number(transformed.savingsId))) {
          transformed.savingsId = Number(transformed.savingsId);
        }
      }
      
      if (transformed.parentRecurringId !== null && transformed.parentRecurringId !== undefined) {
        if (typeof transformed.parentRecurringId === 'object' && transformed.parentRecurringId._id) {
          transformed.parentRecurringId = transformed.parentRecurringId._id.toString();
        } else if (typeof transformed.parentRecurringId === 'object') {
          transformed.parentRecurringId = transformed.parentRecurringId.toString();
        }
        // Keep numeric parentRecurringId as number (from backup)
        else if (typeof transformed.parentRecurringId === 'string' && !isNaN(Number(transformed.parentRecurringId))) {
          transformed.parentRecurringId = Number(transformed.parentRecurringId);
        }
      }
      
      // Fix goals periodValue if missing (from backup files)
      if (transformed.periodValue === null || transformed.periodValue === undefined || transformed.periodValue === '') {
        const period = transformed.period || 'monthly';
        const createdAt = transformed.createdAt ? new Date(transformed.createdAt) : new Date();
        const year = createdAt.getFullYear();
        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
        
        if (period === 'monthly') {
          transformed.periodValue = `${year}-${month}`;
        } else if (period === 'quarterly') {
          const quarter = Math.floor(createdAt.getMonth() / 3) + 1;
          transformed.periodValue = `${year}-Q${quarter}`;
        } else if (period === 'yearly') {
          transformed.periodValue = String(year);
        } else {
          transformed.periodValue = `${year}-${month}`;
        }
      }
      
      // Fix openingBalances periodType (from backup files)
      if (transformed.periodType === 'month') {
        transformed.periodType = 'monthly';
      }
      
      // Remove __v (MongoDB version key)
      delete transformed.__v;
      
      return transformed;
    };
    
    // Transform arrays
    const transformArray = (arr, name) => {
      if (!Array.isArray(arr)) {
        console.warn(`${name}: Not an array:`, arr);
        return [];
      }
      if (arr.length === 0) {
        console.warn(`${name}: Empty array`);
        return [];
      }
      console.log(`Transforming ${name}: ${arr.length} items`);
      const transformed = arr.map(transformDoc);
      console.log(`${name}: Transformed ${transformed.length} items`);
      return transformed;
    };

    await db.transaction('rw', db.clients, db.income, db.expenses, db.debts, db.goals, db.invoices, db.todos, db.lists, db.savings, db.savingsTransactions, db.openingBalances, db.expectedIncome, async () => {
      // Clear all data first to prevent duplicates
      await db.clients.clear();
      await db.income.clear();
      await db.expenses.clear();
      await db.debts.clear();
      await db.goals.clear();
      await db.invoices.clear();
      await db.todos.clear();
      await db.lists.clear();
      await db.savings.clear();
      await db.savingsTransactions.clear();
      await db.openingBalances.clear();
      await db.expectedIncome.clear();
      
      // Import transformed data (order matters: lists first, then clients, then others)
      // Use add() to let IndexedDB assign new IDs, then map old IDs to new IDs
      let importCounts = {
        lists: 0,
        clients: 0,
        income: 0,
        expenses: 0,
        debts: 0,
        goals: 0,
        invoices: 0,
        todos: 0,
        savings: 0,
        savingsTransactions: 0,
        openingBalances: 0,
        expectedIncome: 0,
      };
      

      // Helper function to import with put operations (updates existing or creates new)
      // Check each record individually to prevent duplicates with ++id auto-increment
      const importWithPut = async (store, items, name) => {
        if (!items || items.length === 0) {
          console.log(`${name}: No items to import`);
          return { count: 0 };
        }
        console.log(`${name}: Starting import of ${items.length} items`);
        
        let count = 0;
        let updated = 0;
        let created = 0;
        let errorCount = 0;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            // Check if record exists by ID
            if (item.id !== undefined && item.id !== null) {
              const existing = await store.get(item.id);
              if (existing) {
                // Update existing record
                await store.put(item);
                updated++;
              } else {
                // Create new record with explicit ID
                await store.put(item);
                created++;
              }
            } else {
              // No ID provided, let IndexedDB auto-generate
              await store.add(item);
              created++;
            }
            count++;
          } catch (err) {
            errorCount++;
            console.error(`Error importing ${name} item ${i + 1} (ID: ${item.id}):`, err);
            // Continue with other items even if one fails
          }
        }
        
        console.log(`${name}: Imported ${count}/${items.length} items (${created} created, ${updated} updated, ${errorCount} errors)`);
        return { count };
      };
      
      // Helper function to update foreign key references using ID mapping
      const updateReferences = async (store, items, name, idMaps) => {
        if (!items || items.length === 0) return;
        
        console.log(`${name}: Updating references for ${items.length} items`);
        let updated = 0;
        
        for (const item of items) {
          try {
            const updates = {};
            let needsUpdate = false;
            
            // Update clientId if it exists in the clients map
            if (item.clientId && idMaps.clients && idMaps.clients[item.clientId]) {
              updates.clientId = idMaps.clients[item.clientId];
              needsUpdate = true;
            }
            
            // Update listId if it exists in the lists map
            if (item.listId && idMaps.lists && idMaps.lists[item.listId]) {
              updates.listId = idMaps.lists[item.listId];
              needsUpdate = true;
            }
            
            // Update savingsId if it exists in the savings map
            if (item.savingsId && idMaps.savings && idMaps.savings[item.savingsId]) {
              updates.savingsId = idMaps.savings[item.savingsId];
              needsUpdate = true;
            }
            
            // Update parentRecurringId if it exists in the expenses map
            if (item.parentRecurringId && idMaps.expenses && idMaps.expenses[item.parentRecurringId]) {
              updates.parentRecurringId = idMaps.expenses[item.parentRecurringId];
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              await store.update(item.id, updates);
              updated++;
            }
          } catch (err) {
            console.error(`Error updating ${name} references:`, item, err);
          }
        }
        
        console.log(`${name}: Updated ${updated} items with new references`);
      };

      // Step 1: Import lists first (no dependencies)
      if (data.lists && data.lists.length > 0) {
        const transformedLists = transformArray(data.lists, 'lists');
        try {
          const result = await importWithPut(db.lists, transformedLists, 'lists');
          importCounts.lists = result.count;
          console.log(`Imported ${importCounts.lists} lists`);
        } catch (err) {
          console.error('Error importing lists:', err);
          throw new Error(`Failed to import lists: ${err.message}`);
        }
      } else {
        console.log('No lists to import');
      }
      
      // Step 2: Import clients (no dependencies)
      if (data.clients && data.clients.length > 0) {
        const transformedClients = transformArray(data.clients, 'clients');
        console.log('Sample client after transform:', transformedClients[0]);
        try {
          const result = await importWithPut(db.clients, transformedClients, 'clients');
          importCounts.clients = result.count;
          console.log(`Imported ${importCounts.clients} clients`);
        } catch (err) {
          console.error('Error importing clients:', err);
          throw new Error(`Failed to import clients: ${err.message}`);
        }
      } else {
        console.log('No clients to import');
      }
      
      // Step 3: Import expenses
      if (data.expenses && data.expenses.length > 0) {
        const transformedExpenses = transformArray(data.expenses, 'expenses');
        try {
          const result = await importWithPut(db.expenses, transformedExpenses, 'expenses');
          importCounts.expenses = result.count;
          console.log(`Imported ${importCounts.expenses} expenses`);
        } catch (err) {
          console.error('Error importing expenses:', err);
          throw new Error(`Failed to import expenses: ${err.message}`);
        }
      } else {
        console.log('No expenses to import');
      }
      
      // Step 4: Import income (depends on clients)
      if (data.income && data.income.length > 0) {
        const transformedIncome = transformArray(data.income, 'income');
        try {
          const result = await importWithPut(db.income, transformedIncome, 'income');
          importCounts.income = result.count;
          console.log(`Imported ${importCounts.income} income records`);
        } catch (err) {
          console.error('Error importing income:', err);
          throw new Error(`Failed to import income: ${err.message}`);
        }
      } else {
        console.log('No income to import');
      }
      
      // Step 5: Import other independent collections
      if (data.debts && data.debts.length > 0) {
        const transformedDebts = transformArray(data.debts, 'debts');
        try {
          const result = await importWithPut(db.debts, transformedDebts, 'debts');
          importCounts.debts = result.count;
          console.log(`Imported ${importCounts.debts} debts`);
        } catch (err) {
          console.error('Error importing debts:', err);
          throw new Error(`Failed to import debts: ${err.message}`);
        }
      } else {
        console.log('No debts to import');
      }
      
      if (data.goals && data.goals.length > 0) {
        const transformedGoals = transformArray(data.goals, 'goals');
        try {
          const result = await importWithPut(db.goals, transformedGoals, 'goals');
          importCounts.goals = result.count;
          console.log(`Imported ${importCounts.goals} goals`);
        } catch (err) {
          console.error('Error importing goals:', err);
          throw new Error(`Failed to import goals: ${err.message}`);
        }
      } else {
        console.log('No goals to import');
      }
      
      if (data.invoices && data.invoices.length > 0) {
        const transformedInvoices = transformArray(data.invoices, 'invoices');
        try {
          const result = await importWithPut(db.invoices, transformedInvoices, 'invoices');
          importCounts.invoices = result.count;
          console.log(`Imported ${importCounts.invoices} invoices`);
        } catch (err) {
          console.error('Error importing invoices:', err);
          throw new Error(`Failed to import invoices: ${err.message}`);
        }
      } else {
        console.log('No invoices to import');
      }
      
      if (data.todos && data.todos.length > 0) {
        const transformedTodos = transformArray(data.todos, 'todos');
        try {
          const result = await importWithPut(db.todos, transformedTodos, 'todos');
          importCounts.todos = result.count;
          console.log(`Imported ${importCounts.todos} todos`);
        } catch (err) {
          console.error('Error importing todos:', err);
          throw new Error(`Failed to import todos: ${err.message}`);
        }
      } else {
        console.log('No todos to import');
      }
      
      if (data.savings && data.savings.length > 0) {
        const transformedSavings = transformArray(data.savings, 'savings');
        try {
          const result = await importWithPut(db.savings, transformedSavings, 'savings');
          importCounts.savings = result.count;
          console.log(`Imported ${importCounts.savings} savings`);
        } catch (err) {
          console.error('Error importing savings:', err);
          throw new Error(`Failed to import savings: ${err.message}`);
        }
      } else {
        console.log('No savings to import');
      }
      
      if (data.savingsTransactions && data.savingsTransactions.length > 0) {
        const transformedSavingsTransactions = transformArray(data.savingsTransactions, 'savingsTransactions');
        try {
          const result = await importWithPut(db.savingsTransactions, transformedSavingsTransactions, 'savingsTransactions');
          importCounts.savingsTransactions = result.count;
          console.log(`Imported ${importCounts.savingsTransactions} savings transactions`);
        } catch (err) {
          console.error('Error importing savings transactions:', err);
          throw new Error(`Failed to import savings transactions: ${err.message}`);
        }
      } else {
        console.log('No savingsTransactions to import');
      }
      
      if (data.openingBalances && data.openingBalances.length > 0) {
        const transformedOpeningBalances = transformArray(data.openingBalances, 'openingBalances');
        try {
          const result = await importWithPut(db.openingBalances, transformedOpeningBalances, 'openingBalances');
          importCounts.openingBalances = result.count;
          console.log(`Imported ${importCounts.openingBalances} opening balances`);
        } catch (err) {
          console.error('Error importing opening balances:', err);
          throw new Error(`Failed to import opening balances: ${err.message}`);
        }
      } else {
        console.log('No openingBalances to import');
      }
      
      if (data.expectedIncome && data.expectedIncome.length > 0) {
        const transformedExpectedIncome = transformArray(data.expectedIncome, 'expectedIncome');
        try {
          const result = await importWithPut(db.expectedIncome, transformedExpectedIncome, 'expectedIncome');
          importCounts.expectedIncome = result.count;
          console.log(`Imported ${importCounts.expectedIncome} expected income records`);
        } catch (err) {
          console.error('Error importing expected income:', err);
          throw new Error(`Failed to import expected income: ${err.message}`);
        }
      } else {
        console.log('No expectedIncome to import');
      }

      const totalImported = Object.values(importCounts).reduce((sum, count) => sum + count, 0);
      console.log(`Total imported: ${totalImported} items`, importCounts);
      
      // Verify data was actually saved
      const verifyCounts = {
        lists: await db.lists.count(),
        clients: await db.clients.count(),
        income: await db.income.count(),
        expenses: await db.expenses.count(),
        debts: await db.debts.count(),
        goals: await db.goals.count(),
        invoices: await db.invoices.count(),
        todos: await db.todos.count(),
        savings: await db.savings.count(),
        savingsTransactions: await db.savingsTransactions.count(),
        openingBalances: await db.openingBalances.count(),
        expectedIncome: await db.expectedIncome.count(),
      };
      console.log('Verification - actual counts in database:', verifyCounts);
      
      // Warn if counts don't match
      if (importCounts.lists > 0 && verifyCounts.lists !== importCounts.lists) {
        console.warn(`Lists count mismatch: imported ${importCounts.lists}, found ${verifyCounts.lists}`);
      }
      if (importCounts.clients > 0 && verifyCounts.clients !== importCounts.clients) {
        console.warn(`Clients count mismatch: imported ${importCounts.clients}, found ${verifyCounts.clients}`);
      }
      if (importCounts.income > 0 && verifyCounts.income !== importCounts.income) {
        console.warn(`Income count mismatch: imported ${importCounts.income}, found ${verifyCounts.income}`);
      }
    });
  },
  
  // Clear all data from IndexedDB
  async clearAll() {
    try {
      // Close the database first
      await db.close();
      
      // Delete the entire database
      await new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase('MediaBuyerDashboard');
        deleteRequest.onsuccess = () => {
          console.log('Database deleted successfully');
          resolve();
        };
        deleteRequest.onerror = () => {
          console.error('Error deleting database:', deleteRequest.error);
          reject(deleteRequest.error);
        };
        deleteRequest.onblocked = () => {
          console.warn('Database deletion blocked, trying again...');
          // Try again after a short delay
          setTimeout(() => {
            indexedDB.deleteDatabase('MediaBuyerDashboard').onsuccess = resolve;
          }, 100);
        };
      });
      
      // Reopen the database (it will be recreated)
      await db.open();
      
      return true;
    } catch (error) {
      console.error('Error in clearAll:', error);
      // Fallback: try clearing tables individually
      try {
        await db.transaction('rw', db.clients, db.income, db.expenses, db.debts, db.goals, db.invoices, db.todos, db.lists, db.savings, db.savingsTransactions, db.openingBalances, db.expectedIncome, async () => {
          await db.clients.clear();
          await db.income.clear();
          await db.expenses.clear();
          await db.debts.clear();
          await db.goals.clear();
          await db.invoices.clear();
          await db.todos.clear();
          await db.lists.clear();
          await db.savings.clear();
          await db.savingsTransactions.clear();
          await db.openingBalances.clear();
          await db.expectedIncome.clear();
        });
        return true;
      } catch (fallbackError) {
        console.error('Fallback clear also failed:', fallbackError);
        throw fallbackError;
      }
    }
  },
};

export default db;

