import apiClient from './client.js';

const savingsTransactionsAPI = {
  async getAll() {
    const transactions = await apiClient.get('/api/savings-transactions');
    return transactions.map(transaction => ({
      ...transaction,
      id: transaction._id,
    }));
  },

  async getById(id) {
    const transaction = await apiClient.get(`/api/savings-transactions/${id}`);
    return {
      ...transaction,
      id: transaction._id,
    };
  },

  async add(transaction) {
    const newTransaction = await apiClient.post('/api/savings-transactions', transaction);
    return {
      ...newTransaction,
      id: newTransaction._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/savings-transactions/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/savings-transactions/${id}`);
  },
};

export default savingsTransactionsAPI;
