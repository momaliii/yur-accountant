import apiClient from './client.js';

const goalsAPI = {
  async getAll() {
    const goals = await apiClient.get('/api/goals');
    return goals.map(goal => ({
      ...goal,
      id: goal._id,
    }));
  },

  async getById(id) {
    const goal = await apiClient.get(`/api/goals/${id}`);
    return {
      ...goal,
      id: goal._id,
    };
  },

  async add(goal) {
    const newGoal = await apiClient.post('/api/goals', goal);
    return {
      ...newGoal,
      id: newGoal._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/goals/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/goals/${id}`);
  },
};

export default goalsAPI;
