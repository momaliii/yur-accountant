import apiClient from './client.js';

const incomeAPI = {
  async getAll() {
    const income = await apiClient.get('/api/income');
    return income.map(item => ({
      ...item,
      id: item._id,
    }));
  },

  async getById(id) {
    const item = await apiClient.get(`/api/income/${id}`);
    return {
      ...item,
      id: item._id,
    };
  },

  async add(income) {
    const newIncome = await apiClient.post('/api/income', income);
    return {
      ...newIncome,
      id: newIncome._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/income/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/income/${id}`);
  },
};

export default incomeAPI;
