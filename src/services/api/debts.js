import apiClient from './client.js';

const debtsAPI = {
  async getAll() {
    const debts = await apiClient.get('/api/debts');
    return debts.map(debt => ({
      ...debt,
      id: debt._id,
    }));
  },

  async getById(id) {
    const debt = await apiClient.get(`/api/debts/${id}`);
    return {
      ...debt,
      id: debt._id,
    };
  },

  async add(debt) {
    const newDebt = await apiClient.post('/api/debts', debt);
    return {
      ...newDebt,
      id: newDebt._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/debts/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/debts/${id}`);
  },
};

export default debtsAPI;
