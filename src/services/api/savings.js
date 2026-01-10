import apiClient from './client.js';

const savingsAPI = {
  async getAll() {
    const savings = await apiClient.get('/api/savings');
    return savings.map(saving => ({
      ...saving,
      id: saving._id,
    }));
  },

  async getById(id) {
    const saving = await apiClient.get(`/api/savings/${id}`);
    return {
      ...saving,
      id: saving._id,
    };
  },

  async add(saving) {
    const newSaving = await apiClient.post('/api/savings', saving);
    return {
      ...newSaving,
      id: newSaving._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/savings/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/savings/${id}`);
  },
};

export default savingsAPI;
