import Client from '../models/Client.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Debt from '../models/Debt.js';
import Goal from '../models/Goal.js';
import Invoice from '../models/Invoice.js';
import Todo from '../models/Todo.js';
import List from '../models/List.js';
import Saving from '../models/Saving.js';
import SavingsTransaction from '../models/SavingsTransaction.js';
import OpeningBalance from '../models/OpeningBalance.js';
import ExpectedIncome from '../models/ExpectedIncome.js';
import { getUserId } from '../middleware/auth.js';

export default async function migrationRoutes(fastify, options) {
  // Upload and import data
  fastify.post('/upload', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const data = request.body;

      if (!data || typeof data !== 'object') {
        return reply.code(400).send({ error: 'Invalid data format' });
      }

      const results = {
        clients: { imported: 0, errors: [] },
        income: { imported: 0, errors: [] },
        expenses: { imported: 0, errors: [] },
        debts: { imported: 0, errors: [] },
        goals: { imported: 0, errors: [] },
        invoices: { imported: 0, errors: [] },
        todos: { imported: 0, errors: [] },
        lists: { imported: 0, errors: [] },
        savings: { imported: 0, errors: [] },
        savingsTransactions: { imported: 0, errors: [] },
        openingBalances: { imported: 0, errors: [] },
        expectedIncome: { imported: 0, errors: [] },
      };

      // Create a mapping for old IDs to new MongoDB IDs
      const idMapping = {
        clients: {},
        lists: {},
        savings: {},
      };

      // Import Lists first (todos depend on lists)
      if (data.lists && Array.isArray(data.lists)) {
        for (const list of data.lists) {
          try {
            // Check if default list exists
            let defaultList = await List.findOne({ userId, name: 'Default' });
            if (!defaultList) {
              defaultList = new List({ userId, name: 'Default', color: 'indigo' });
              await defaultList.save();
            }

            // Skip if it's the default list and already exists
            if (list.name === 'Default' && defaultList) {
              idMapping.lists[list.id] = defaultList._id;
              results.lists.imported++;
              continue;
            }

            const newList = new List({
              userId,
              name: list.name || 'Unnamed List',
              color: list.color || 'indigo',
              createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
              updatedAt: list.updatedAt ? new Date(list.updatedAt) : new Date(),
            });
            await newList.save();
            if (list.id) idMapping.lists[list.id] = newList._id;
            results.lists.imported++;
          } catch (error) {
            results.lists.errors.push({ id: list.id, error: error.message });
          }
        }
      }

      // Import Clients
      if (data.clients && Array.isArray(data.clients)) {
        for (const client of data.clients) {
          try {
            const newClient = new Client({
              userId,
              name: client.name || 'Unnamed Client',
              email: client.email,
              phone: client.phone,
              paymentModel: client.paymentModel || 'fixed',
              fixedAmount: client.fixedAmount,
              adSpendPercentage: client.adSpendPercentage,
              subcontractorCost: client.subcontractorCost,
              currency: client.currency || 'EGP',
              services: client.services || [],
              notes: client.notes,
              rating: client.rating || 3,
              riskLevel: client.riskLevel || 'medium',
              status: client.status || 'active',
              createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
            });
            await newClient.save();
            if (client.id) idMapping.clients[client.id] = newClient._id;
            results.clients.imported++;
          } catch (error) {
            results.clients.errors.push({ id: client.id, error: error.message });
          }
        }
      }

      // Import Income
      if (data.income && Array.isArray(data.income)) {
        // Map old paymentMethod values to valid enum values
        const paymentMethodMap = {
          'bank': 'bank_transfer',
          'fawaterak_international': 'bank_transfer',
          'fawaterak': 'bank_transfer',
          'fawaterak international': 'bank_transfer',
          'vodafone_cash': 'vodafone_cash',
          'vodafone cash': 'vodafone_cash',
          'bank_transfer': 'bank_transfer',
          'bank transfer': 'bank_transfer',
          'instapay': 'instapay',
          'cash': 'cash',
          'other': 'other',
        };

        for (const income of data.income) {
          try {
            const clientId = income.clientId && idMapping.clients[income.clientId]
              ? idMapping.clients[income.clientId]
              : null;

            // Map payment method to valid enum value (handle null/undefined and trim whitespace)
            const rawPaymentMethod = income.paymentMethod?.toString().trim().toLowerCase() || '';
            const paymentMethod = paymentMethodMap[rawPaymentMethod] || 'cash';

            const newIncome = new Income({
              userId,
              clientId,
              amount: income.amount || 0,
              currency: income.currency || 'EGP',
              paymentMethod,
              receivedDate: income.receivedDate ? new Date(income.receivedDate) : new Date(),
              isDeposit: income.isDeposit || false,
              isFixedPortionOnly: income.isFixedPortionOnly || false,
              taxCategory: income.taxCategory,
              isTaxable: income.isTaxable !== undefined ? income.isTaxable : true,
              taxRate: income.taxRate,
              netAmount: income.netAmount,
              fee: income.fee,
              adSpend: income.adSpend,
              projectName: income.projectName,
              notes: income.notes,
              createdAt: income.createdAt ? new Date(income.createdAt) : new Date(),
            });
            await newIncome.save();
            results.income.imported++;
          } catch (error) {
            results.income.errors.push({ id: income.id, error: error.message });
          }
        }
      }

      // Import Expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        // Store expense ID mapping for parentRecurringId resolution
        const expenseIdMapping = {};

        for (const expense of data.expenses) {
          try {
            const clientId = expense.clientId && idMapping.clients[expense.clientId]
              ? idMapping.clients[expense.clientId]
              : null;

            // Handle parentRecurringId - if it's a number (old ID), set to null
            // We'll update it after all expenses are imported if needed
            let parentRecurringId = null;
            if (expense.parentRecurringId) {
              // If it's already an ObjectId string, use it
              if (typeof expense.parentRecurringId === 'string' && expense.parentRecurringId.match(/^[0-9a-fA-F]{24}$/)) {
                parentRecurringId = expense.parentRecurringId;
              } else if (typeof expense.parentRecurringId === 'number') {
                // Old numeric ID - will be set to null for now
                parentRecurringId = null;
              }
            }

            const newExpense = new Expense({
              userId,
              clientId,
              amount: expense.amount || 0,
              currency: expense.currency || 'EGP',
              category: expense.category || 'other',
              date: expense.date ? new Date(expense.date) : new Date(),
              description: expense.description,
              isRecurring: expense.isRecurring || false,
              parentRecurringId,
              taxCategory: expense.taxCategory,
              isTaxDeductible: expense.isTaxDeductible || false,
              taxRate: expense.taxRate,
              notes: expense.notes,
              createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
            });
            await newExpense.save();
            
            // Store mapping for parentRecurringId resolution
            if (expense.id) {
              expenseIdMapping[expense.id] = newExpense._id;
            }
            
            results.expenses.imported++;
          } catch (error) {
            results.expenses.errors.push({ id: expense.id, error: error.message });
          }
        }

        // Second pass: Update parentRecurringId for expenses that had numeric parent IDs
        if (data.expenses && Array.isArray(data.expenses)) {
          for (const expense of data.expenses) {
            if (expense.parentRecurringId && typeof expense.parentRecurringId === 'number' && expense.id) {
              try {
                const newExpenseId = expenseIdMapping[expense.id];
                const parentId = expenseIdMapping[expense.parentRecurringId];
                
                if (newExpenseId && parentId) {
                  await Expense.updateOne(
                    { _id: newExpenseId },
                    { $set: { parentRecurringId: parentId } }
                  );
                }
              } catch (error) {
                // Silently fail - expense was already imported
              }
            }
          }
        }
      }

      // Import Debts
      if (data.debts && Array.isArray(data.debts)) {
        for (const debt of data.debts) {
          try {
            const newDebt = new Debt({
              userId,
              type: debt.type || 'owed_to_me',
              partyName: debt.partyName || 'Unknown',
              amount: debt.amount || 0,
              currency: debt.currency || 'EGP',
              dueDate: debt.dueDate ? new Date(debt.dueDate) : new Date(),
              status: debt.status || 'pending',
              notes: debt.notes,
              createdAt: debt.createdAt ? new Date(debt.createdAt) : new Date(),
            });
            await newDebt.save();
            results.debts.imported++;
          } catch (error) {
            results.debts.errors.push({ id: debt.id, error: error.message });
          }
        }
      }

      // Import Goals
      if (data.goals && Array.isArray(data.goals)) {
        for (const goal of data.goals) {
          try {
            const period = goal.period || 'monthly';
            const createdAt = goal.createdAt ? new Date(goal.createdAt) : new Date();
            
            // Generate periodValue if missing or empty
            let periodValue = goal.periodValue?.toString().trim();
            if (!periodValue || periodValue === '') {
              const year = createdAt.getFullYear();
              const month = String(createdAt.getMonth() + 1).padStart(2, '0');
              
              if (period === 'monthly') {
                periodValue = `${year}-${month}`;
              } else if (period === 'quarterly') {
                const quarter = Math.floor(createdAt.getMonth() / 3) + 1;
                periodValue = `${year}-Q${quarter}`;
              } else if (period === 'yearly') {
                periodValue = String(year);
              } else {
                periodValue = `${year}-${month}`; // Default to monthly format
              }
            }

            const newGoal = new Goal({
              userId,
              type: goal.type || 'income',
              targetAmount: goal.targetAmount || 0,
              currentAmount: goal.currentAmount || 0,
              period,
              periodValue,
              category: goal.category,
              notes: goal.notes,
              createdAt,
              updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : new Date(),
            });
            await newGoal.save();
            results.goals.imported++;
          } catch (error) {
            results.goals.errors.push({ id: goal.id, error: error.message });
          }
        }
      }

      // Import Invoices
      if (data.invoices && Array.isArray(data.invoices)) {
        for (const invoice of data.invoices) {
          try {
            const clientId = invoice.clientId && idMapping.clients[invoice.clientId]
              ? idMapping.clients[invoice.clientId]
              : null;

            const newInvoice = new Invoice({
              userId,
              clientId,
              invoiceNumber: invoice.invoiceNumber || `INV-${Date.now()}`,
              amount: invoice.amount || 0,
              currency: invoice.currency || 'EGP',
              issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
              status: invoice.status || 'draft',
              items: invoice.items || [],
              notes: invoice.notes,
              createdAt: invoice.createdAt ? new Date(invoice.createdAt) : new Date(),
              updatedAt: invoice.updatedAt ? new Date(invoice.updatedAt) : new Date(),
            });
            await newInvoice.save();
            results.invoices.imported++;
          } catch (error) {
            results.invoices.errors.push({ id: invoice.id, error: error.message });
          }
        }
      }

      // Import Todos
      if (data.todos && Array.isArray(data.todos)) {
        for (const todo of data.todos) {
          try {
            const listId = todo.listId && idMapping.lists[todo.listId]
              ? idMapping.lists[todo.listId]
              : (await List.findOne({ userId, name: 'Default' }))?._id;

            if (!listId) {
              results.todos.errors.push({ id: todo.id, error: 'No list found' });
              continue;
            }

            const newTodo = new Todo({
              userId,
              listId,
              title: todo.title || 'Untitled',
              description: todo.description,
              priority: todo.priority || 'medium',
              category: todo.category,
              dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
              completed: todo.completed || false,
              isRecurring: todo.isRecurring || false,
              recurrencePattern: todo.recurrencePattern,
              createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
              updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : new Date(),
            });
            await newTodo.save();
            results.todos.imported++;
          } catch (error) {
            results.todos.errors.push({ id: todo.id, error: error.message });
          }
        }
      }

      // Import Savings
      if (data.savings && Array.isArray(data.savings)) {
        for (const saving of data.savings) {
          try {
            const newSaving = new Saving({
              userId,
              name: saving.name || 'Unnamed Saving',
              type: saving.type || 'money',
              currency: saving.currency || 'EGP',
              initialAmount: saving.initialAmount || 0,
              currentAmount: saving.currentAmount || saving.initialAmount || 0,
              targetAmount: saving.targetAmount,
              targetDate: saving.targetDate ? new Date(saving.targetDate) : null,
              interestRate: saving.interestRate,
              maturityDate: saving.maturityDate ? new Date(saving.maturityDate) : null,
              startDate: saving.startDate ? new Date(saving.startDate) : (saving.createdAt ? new Date(saving.createdAt) : new Date()),
              quantity: saving.quantity,
              pricePerUnit: saving.pricePerUnit,
              notes: saving.notes,
              createdAt: saving.createdAt ? new Date(saving.createdAt) : new Date(),
              updatedAt: saving.updatedAt ? new Date(saving.updatedAt) : new Date(),
            });
            await newSaving.save();
            if (saving.id) idMapping.savings[saving.id] = newSaving._id;
            results.savings.imported++;
          } catch (error) {
            results.savings.errors.push({ id: saving.id, error: error.message });
          }
        }
      }

      // Import Savings Transactions
      if (data.savingsTransactions && Array.isArray(data.savingsTransactions)) {
        for (const transaction of data.savingsTransactions) {
          try {
            const savingsId = transaction.savingsId && idMapping.savings[transaction.savingsId]
              ? idMapping.savings[transaction.savingsId]
              : null;

            if (!savingsId) {
              results.savingsTransactions.errors.push({ id: transaction.id, error: 'Savings not found' });
              continue;
            }

            const newTransaction = new SavingsTransaction({
              userId,
              savingsId,
              type: transaction.type || 'deposit',
              amount: transaction.amount || 0,
              currency: transaction.currency || 'EGP',
              date: transaction.date ? new Date(transaction.date) : new Date(),
              pricePerUnit: transaction.pricePerUnit,
              quantity: transaction.quantity,
              notes: transaction.notes,
              createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
            });
            await newTransaction.save();
            results.savingsTransactions.imported++;
          } catch (error) {
            results.savingsTransactions.errors.push({ id: transaction.id, error: error.message });
          }
        }
      }

      // Import Opening Balances
      if (data.openingBalances && Array.isArray(data.openingBalances)) {
        for (const balance of data.openingBalances) {
          try {
            // Map old periodType values to valid enum values
            let periodType = balance.periodType || 'monthly';
            if (periodType === 'month') {
              periodType = 'monthly';
            } else if (periodType !== 'monthly' && periodType !== 'yearly') {
              periodType = 'monthly'; // Default to monthly if invalid
            }

            const existing = await OpeningBalance.findOne({
              userId,
              periodType,
              period: balance.period || '',
            });

            if (existing) {
              existing.amount = balance.amount || 0;
              existing.currency = balance.currency || 'EGP';
              existing.notes = balance.notes;
              existing.updatedAt = new Date();
              await existing.save();
            } else {
              const newBalance = new OpeningBalance({
                userId,
                periodType,
                period: balance.period || '',
                amount: balance.amount || 0,
                currency: balance.currency || 'EGP',
                notes: balance.notes,
                createdAt: balance.createdAt ? new Date(balance.createdAt) : new Date(),
                updatedAt: balance.updatedAt ? new Date(balance.updatedAt) : new Date(),
              });
              await newBalance.save();
            }
            results.openingBalances.imported++;
          } catch (error) {
            results.openingBalances.errors.push({ id: balance.id, error: error.message });
          }
        }
      }

      // Import Expected Income
      if (data.expectedIncome && Array.isArray(data.expectedIncome)) {
        for (const expectedIncome of data.expectedIncome) {
          try {
            const clientId = expectedIncome.clientId && idMapping.clients[expectedIncome.clientId]
              ? idMapping.clients[expectedIncome.clientId]
              : null;

            if (!clientId) {
              results.expectedIncome.errors.push({ id: expectedIncome.id, error: 'Client not found' });
              continue;
            }

            const existing = await ExpectedIncome.findOne({
              userId,
              clientId,
              period: expectedIncome.period,
            });

            if (existing) {
              existing.expectedAmount = expectedIncome.expectedAmount || 0;
              existing.currency = expectedIncome.currency || 'EGP';
              existing.notes = expectedIncome.notes;
              existing.isPaid = expectedIncome.isPaid || false;
              existing.updatedAt = new Date();
              await existing.save();
            } else {
              const newExpectedIncome = new ExpectedIncome({
                userId,
                clientId,
                period: expectedIncome.period || '',
                expectedAmount: expectedIncome.expectedAmount || 0,
                currency: expectedIncome.currency || 'EGP',
                notes: expectedIncome.notes,
                isPaid: expectedIncome.isPaid || false,
                createdAt: expectedIncome.createdAt ? new Date(expectedIncome.createdAt) : new Date(),
                updatedAt: expectedIncome.updatedAt ? new Date(expectedIncome.updatedAt) : new Date(),
              });
              await newExpectedIncome.save();
            }
            results.expectedIncome.imported++;
          } catch (error) {
            results.expectedIncome.errors.push({ id: expectedIncome.id, error: error.message });
          }
        }
      }

      // Calculate totals
      const totals = {
        imported: Object.values(results).reduce((sum, r) => sum + r.imported, 0),
        errors: Object.values(results).reduce((sum, r) => sum + r.errors.length, 0),
      };

      return {
        success: true,
        summary: totals,
        details: results,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Migration failed', message: error.message });
    }
  });
}
