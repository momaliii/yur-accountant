import apiClient from './client.js';

const openingBalancesAPI = {
  async getAll() {
    const balances = await apiClient.get('/api/opening-balances');
    return balances.map(balance => ({
      ...balance,
      id: balance._id,
    }));
  },

  async getById(id) {
    const balance = await apiClient.get(`/api/opening-balances/${id}`);
    return {
      ...balance,
      id: balance._id,
    };
  },

  async add(balance) {
    const newBalance = await apiClient.post('/api/opening-balances', balance);
    return {
      ...newBalance,
      id: newBalance._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/opening-balances/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/opening-balances/${id}`);
  },
};

export default openingBalancesAPI;
