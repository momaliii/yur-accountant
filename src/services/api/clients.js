import apiClient from './client.js';

const clientsAPI = {
  async getAll() {
    const clients = await apiClient.get('/api/clients');
    return clients.map(client => ({
      ...client,
      id: client._id,
    }));
  },

  async getById(id) {
    const client = await apiClient.get(`/api/clients/${id}`);
    return {
      ...client,
      id: client._id,
    };
  },

  async add(client) {
    const newClient = await apiClient.post('/api/clients', client);
    return {
      ...newClient,
      id: newClient._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/clients/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/clients/${id}`);
  },
};

export default clientsAPI;
