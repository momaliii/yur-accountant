import apiClient from './client.js';

const listsAPI = {
  async getAll() {
    const lists = await apiClient.get('/api/lists');
    return lists.map(list => ({
      ...list,
      id: list._id,
    }));
  },

  async getById(id) {
    const list = await apiClient.get(`/api/lists/${id}`);
    return {
      ...list,
      id: list._id,
    };
  },

  async add(list) {
    const newList = await apiClient.post('/api/lists', list);
    return {
      ...newList,
      id: newList._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/lists/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/lists/${id}`);
  },
};

export default listsAPI;
