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
      exportedAt: new Date().toISOString(),
    };
    return data;
  },
  
  async importAll(data) {
    await db.transaction('rw', db.clients, db.income, db.expenses, db.debts, db.goals, db.invoices, db.todos, db.lists, db.savings, db.savingsTransactions, async () => {
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
      
      if (data.lists) await db.lists.bulkAdd(data.lists);
      if (data.clients) await db.clients.bulkAdd(data.clients);
      if (data.income) await db.income.bulkAdd(data.income);
      if (data.expenses) await db.expenses.bulkAdd(data.expenses);
      if (data.debts) await db.debts.bulkAdd(data.debts);
      if (data.goals) await db.goals.bulkAdd(data.goals);
      if (data.invoices) await db.invoices.bulkAdd(data.invoices);
      if (data.todos) await db.todos.bulkAdd(data.todos);
      if (data.savings) await db.savings.bulkAdd(data.savings);
      if (data.savingsTransactions) await db.savingsTransactions.bulkAdd(data.savingsTransactions);
    });
  },
};

export default db;

