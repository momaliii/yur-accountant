import apiClient from './client.js';

const expectedIncomeAPI = {
  async getAll() {
    const expectedIncome = await apiClient.get('/api/expected-income');
    return expectedIncome.map(item => ({
      ...item,
      id: item._id,
    }));
  },

  async getById(id) {
    const item = await apiClient.get(`/api/expected-income/${id}`);
    return {
      ...item,
      id: item._id,
    };
  },

  async add(expectedIncome) {
    const newItem = await apiClient.post('/api/expected-income', expectedIncome);
    return {
      ...newItem,
      id: newItem._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/expected-income/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/expected-income/${id}`);
  },
};

export default expectedIncomeAPI;
