import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js';
import authService from '../auth/authService.js';

class SupabaseSyncService {
  constructor() {
    this.isSyncing = false;
  }

  // Check if Supabase is available and user is authenticated
  isAvailable() {
    return isSupabaseConfigured() && authService.isAuthenticated();
  }

  // Get user ID from auth service
  getUserId() {
    const user = authService.getUser();
    return user?._id || user?.id || null;
  }

  // Sync single entity to Supabase
  async syncEntity(entity, operation, data) {
    if (!this.isAvailable()) {
      return null;
    }

    const client = getSupabaseClient();
    if (!client) {
      return null;
    }

    const userId = this.getUserId();
    if (!userId) {
      console.warn('No user ID available for Supabase sync');
      return null;
    }

    try {
      // Map entity names to Supabase table names
      const tableMap = {
        client: 'clients',
        clients: 'clients',
        income: 'income',
        expense: 'expenses',
        expenses: 'expenses',
        debt: 'debts',
        debts: 'debts',
        goal: 'goals',
        goals: 'goals',
        invoice: 'invoices',
        invoices: 'invoices',
        todo: 'todos',
        todos: 'todos',
        list: 'lists',
        lists: 'lists',
        saving: 'savings',
        savings: 'savings',
        savingsTransaction: 'savings_transactions',
        savingsTransactions: 'savings_transactions',
        openingBalance: 'opening_balances',
        openingBalances: 'opening_balances',
        expectedIncome: 'expected_income',
      };

      const tableName = tableMap[entity];
      if (!tableName) {
        console.warn(`No Supabase table mapping for entity: ${entity}`);
        return null;
      }

      // Prepare data for Supabase
      const supabaseData = this.prepareDataForSupabase(data, userId, operation, entity);

      let result = null;

      switch (operation) {
        case 'add':
        case 'create':
          // Insert new record
          // Remove id from data if it's not a valid UUID (let Supabase generate it)
          if (supabaseData.id && !this.isValidUUID(supabaseData.id)) {
            delete supabaseData.id;
          }
          
          const { data: inserted, error: insertError } = await client
            .from(tableName)
            .insert(supabaseData)
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }
          result = inserted;
          break;

        case 'update':
          // Update existing record
          // Check if we have a valid UUID (supabase_id) or need to create new record
          const recordId = data.supabase_id || (data.mongoId && this.isValidUUID(data.mongoId) ? data.mongoId : null);
          
          if (!recordId || !this.isValidUUID(recordId)) {
            // No valid UUID found - this means the record doesn't exist in Supabase yet
            // Create it as a new record instead of updating
            console.log(`No valid Supabase ID found for ${entity}, creating new record instead of updating`);
            const { data: inserted, error: insertError } = await client
              .from(tableName)
              .insert(supabaseData)
              .select()
              .single();

            if (insertError) {
              throw insertError;
            }
            result = inserted;
          } else {
            // Valid UUID exists, perform update
            const { data: updated, error: updateError } = await client
              .from(tableName)
              .update(supabaseData)
              .eq('id', recordId)
              .eq('user_id', userId) // Ensure user owns the record
              .select()
              .single();

            if (updateError) {
              throw updateError;
            }
            result = updated;
          }
          break;

        case 'delete':
        case 'remove':
          // Delete record - only if we have a valid UUID
          const deleteId = data.supabase_id || (data.mongoId && this.isValidUUID(data.mongoId) ? data.mongoId : null);
          if (!deleteId || !this.isValidUUID(deleteId)) {
            // No valid UUID - record doesn't exist in Supabase, skip delete
            console.log(`No valid Supabase ID found for ${entity}, skipping delete (record doesn't exist in Supabase)`);
            result = { deleted: false, skipped: true };
            break;
          }

          const { error: deleteError } = await client
            .from(tableName)
            .delete()
            .eq('id', deleteId)
            .eq('user_id', userId); // Ensure user owns the record

          if (deleteError) {
            throw deleteError;
          }
          result = { deleted: true };
          break;

        default:
          console.warn(`Unknown operation: ${operation}`);
      }

      return result;
    } catch (error) {
      console.error(`Error syncing ${entity} ${operation} to Supabase:`, error);
      throw error;
    }
  }

  // Prepare data for Supabase (add user_id, convert fields, filter unknown columns)
  prepareDataForSupabase(data, userId, operation = 'add', entity = null) {
    const prepared = { ...data };

    // Add user_id
    prepared.user_id = userId;

    // Remove local id (Supabase will use its own id) for create operations
    if (operation === 'add' || operation === 'create') {
      delete prepared.id;
    }

    // Convert mongoId/_id to id if exists (Supabase uses 'id' as primary key)
    // Only use it if it's a valid UUID, otherwise Supabase will generate a new one
    if (prepared.mongoId || prepared._id) {
      const recordId = prepared.mongoId || prepared._id;
      // Only use the ID if it's a valid UUID and it's an update/delete operation
      if (operation !== 'add' && operation !== 'create' && this.isValidUUID(recordId)) {
        prepared.id = recordId;
      }
      // Keep mongoId for reference but don't send it to Supabase
      delete prepared.mongoId;
      delete prepared._id;
    }

    // Remove __v (MongoDB version key)
    delete prepared.__v;

    // Convert camelCase to snake_case and filter unknown columns based on entity
    const allowedFields = this.getAllowedFieldsForEntity(entity);
    const filtered = {};
    
    for (const [key, value] of Object.entries(prepared)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      // Check if field is allowed (or if no entity specified, allow all)
      if (!allowedFields || allowedFields.includes(snakeKey) || allowedFields.includes(key)) {
        filtered[snakeKey] = value;
      } else {
        // Silently skip unknown fields
        console.debug(`Skipping unknown field: ${key} (${snakeKey}) for entity: ${entity}`);
      }
    }

    return filtered;
  }

  // Helper to check if a string is a valid UUID
  isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Update local supabase_id after sync
  async updateLocalSupabaseId(entity, localId, supabaseId) {
    try {
      const { db } = await import('../db/database.js');
      const dbMap = {
        client: 'clients',
        clients: 'clients',
        income: 'income',
        expense: 'expenses',
        expenses: 'expenses',
        debt: 'debts',
        debts: 'debts',
        goal: 'goals',
        goals: 'goals',
        invoice: 'invoices',
        invoices: 'invoices',
        todo: 'todos',
        todos: 'todos',
        list: 'lists',
        lists: 'lists',
        saving: 'savings',
        savings: 'savings',
        savingsTransaction: 'savingsTransactions',
        savingsTransactions: 'savingsTransactions',
        openingBalance: 'openingBalances',
        openingBalances: 'openingBalances',
        expectedIncome: 'expectedIncome',
      };

      const dbName = dbMap[entity];
      if (!dbName) {
        console.warn(`No database mapping for entity: ${entity}`);
        return;
      }

      // Get the item from IndexedDB
      const item = await db[dbName].get(localId);
      
      if (item) {
        // Update the item with supabase_id
        await db[dbName].update(localId, { 
          supabase_id: supabaseId, 
          mongoId: supabaseId // Also update mongoId for compatibility
        });
        
        console.log(`Updated supabase_id for ${entity} (local ID: ${localId}, Supabase ID: ${supabaseId})`);
      }
    } catch (error) {
      console.error(`Error updating supabase_id for ${entity}:`, error);
    }
  }

  // Get allowed fields for each entity based on Supabase schema
  getAllowedFieldsForEntity(entity) {
    const fieldMap = {
      client: ['id', 'user_id', 'name', 'email', 'payment_model', 'currency', 'rating', 'risk_level', 'status', 'created_at', 'updated_at'],
      clients: ['id', 'user_id', 'name', 'email', 'payment_model', 'currency', 'rating', 'risk_level', 'status', 'created_at', 'updated_at'],
      income: ['id', 'user_id', 'client_id', 'amount', 'currency', 'payment_method', 'received_date', 'is_deposit', 'is_fixed_portion_only', 'tax_category', 'is_taxable', 'tax_rate', 'created_at', 'updated_at'],
      expense: ['id', 'user_id', 'client_id', 'amount', 'currency', 'category', 'date', 'description', 'is_recurring', 'parent_recurring_id', 'tax_category', 'is_tax_deductible', 'tax_rate', 'created_at', 'updated_at'],
      expenses: ['id', 'user_id', 'client_id', 'amount', 'currency', 'category', 'date', 'description', 'is_recurring', 'parent_recurring_id', 'tax_category', 'is_tax_deductible', 'tax_rate', 'created_at', 'updated_at'],
      debt: ['id', 'user_id', 'type', 'party_name', 'amount', 'currency', 'due_date', 'status', 'paid_amount', 'created_at', 'updated_at'],
      debts: ['id', 'user_id', 'type', 'party_name', 'amount', 'currency', 'due_date', 'status', 'paid_amount', 'created_at', 'updated_at'],
      goal: ['id', 'user_id', 'type', 'target_amount', 'current_amount', 'period', 'period_value', 'category', 'created_at', 'updated_at'],
      goals: ['id', 'user_id', 'type', 'target_amount', 'current_amount', 'period', 'period_value', 'category', 'created_at', 'updated_at'],
      invoice: ['id', 'user_id', 'client_id', 'invoice_number', 'amount', 'currency', 'issue_date', 'due_date', 'status', 'items', 'notes', 'created_at', 'updated_at'],
      invoices: ['id', 'user_id', 'client_id', 'invoice_number', 'amount', 'currency', 'issue_date', 'due_date', 'status', 'items', 'notes', 'created_at', 'updated_at'],
      todo: ['id', 'user_id', 'list_id', 'title', 'description', 'priority', 'category', 'due_date', 'completed', 'is_recurring', 'recurrence_pattern', 'created_at', 'updated_at'],
      todos: ['id', 'user_id', 'list_id', 'title', 'description', 'priority', 'category', 'due_date', 'completed', 'is_recurring', 'recurrence_pattern', 'created_at', 'updated_at'],
      list: ['id', 'user_id', 'name', 'color', 'created_at', 'updated_at'],
      lists: ['id', 'user_id', 'name', 'color', 'created_at', 'updated_at'],
      saving: ['id', 'user_id', 'name', 'type', 'currency', 'initial_amount', 'current_amount', 'target_amount', 'target_date', 'interest_rate', 'maturity_date', 'start_date', 'quantity', 'price_per_unit', 'notes', 'created_at', 'updated_at'],
      savings: ['id', 'user_id', 'name', 'type', 'currency', 'initial_amount', 'current_amount', 'target_amount', 'target_date', 'interest_rate', 'maturity_date', 'start_date', 'quantity', 'price_per_unit', 'notes', 'created_at', 'updated_at'],
      savingsTransaction: ['id', 'user_id', 'savings_id', 'type', 'amount', 'currency', 'date', 'price_per_unit', 'quantity', 'notes', 'created_at'],
      savingsTransactions: ['id', 'user_id', 'savings_id', 'type', 'amount', 'currency', 'date', 'price_per_unit', 'quantity', 'notes', 'created_at'],
      openingBalance: ['id', 'user_id', 'period_type', 'period', 'amount', 'currency', 'notes', 'created_at', 'updated_at'],
      openingBalances: ['id', 'user_id', 'period_type', 'period', 'amount', 'currency', 'notes', 'created_at', 'updated_at'],
      expectedIncome: ['id', 'user_id', 'client_id', 'period', 'expected_amount', 'currency', 'notes', 'is_paid', 'created_at', 'updated_at'],
    };

    return fieldMap[entity] || null; // Return null to allow all fields if entity not found
  }

  // Sync all data from Supabase to local
  async syncFromSupabase() {
    if (!this.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }

    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;

    try {
      const client = getSupabaseClient();
      const userId = this.getUserId();

      // Fetch all data from Supabase
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
        client.from('clients').select('*').eq('user_id', userId),
        client.from('income').select('*').eq('user_id', userId),
        client.from('expenses').select('*').eq('user_id', userId),
        client.from('debts').select('*').eq('user_id', userId),
        client.from('goals').select('*').eq('user_id', userId),
        client.from('invoices').select('*').eq('user_id', userId),
        client.from('todos').select('*').eq('user_id', userId),
        client.from('lists').select('*').eq('user_id', userId),
        client.from('savings').select('*').eq('user_id', userId),
        client.from('savings_transactions').select('*').eq('user_id', userId),
        client.from('opening_balances').select('*').eq('user_id', userId),
        client.from('expected_income').select('*').eq('user_id', userId),
      ]);

      // Transform Supabase data to local format
      const transformData = (items) => {
        return items.data?.map(item => {
          const transformed = { ...item };
          // Convert supabase_id to mongoId for compatibility
          if (transformed.id) {
            transformed.mongoId = transformed.id;
            transformed.supabase_id = transformed.id;
          }
          delete transformed.user_id;
          return transformed;
        }) || [];
      };

      const data = {
        clients: transformData(clients),
        income: transformData(income),
        expenses: transformData(expenses),
        debts: transformData(debts),
        goals: transformData(goals),
        invoices: transformData(invoices),
        todos: transformData(todos),
        lists: transformData(lists),
        savings: transformData(savings),
        savingsTransactions: transformData(savingsTransactions),
        openingBalances: transformData(openingBalances),
        expectedIncome: transformData(expectedIncome),
      };

      // Check if there's any data to import
      const hasData = Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
      
      if (hasData) {
        // Import to IndexedDB
        const { backupDB } = await import('../db/database.js');
        await backupDB.importAll(data);
      } else {
        console.log('No data in Supabase to sync - this is normal for first-time setup');
      }

      return {
        success: true,
        data: {
          clients: data.clients.length,
          income: data.income.length,
          expenses: data.expenses.length,
          debts: data.debts.length,
          goals: data.goals.length,
          invoices: data.invoices.length,
          todos: data.todos.length,
          lists: data.lists.length,
          savings: data.savings.length,
          savingsTransactions: data.savingsTransactions.length,
          openingBalances: data.openingBalances.length,
          expectedIncome: data.expectedIncome.length,
        },
      };
    } catch (error) {
      console.error('Error syncing from Supabase:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }
}

const supabaseSyncService = new SupabaseSyncService();
export default supabaseSyncService;
