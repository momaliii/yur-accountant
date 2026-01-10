import apiClient from './client.js';

const expensesAPI = {
  async getAll() {
    const expenses = await apiClient.get('/api/expenses');
    return expenses.map(expense => ({
      ...expense,
      id: expense._id,
    }));
  },

  async getById(id) {
    const expense = await apiClient.get(`/api/expenses/${id}`);
    return {
      ...expense,
      id: expense._id,
    };
  },

  async add(expense) {
    const newExpense = await apiClient.post('/api/expenses', expense);
    return {
      ...newExpense,
      id: newExpense._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/expenses/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/expenses/${id}`);
  },
};

export default expensesAPI;
