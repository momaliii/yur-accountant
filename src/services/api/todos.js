import apiClient from './client.js';

const todosAPI = {
  async getAll() {
    const todos = await apiClient.get('/api/todos');
    return todos.map(todo => ({
      ...todo,
      id: todo._id,
    }));
  },

  async getById(id) {
    const todo = await apiClient.get(`/api/todos/${id}`);
    return {
      ...todo,
      id: todo._id,
    };
  },

  async add(todo) {
    const newTodo = await apiClient.post('/api/todos', todo);
    return {
      ...newTodo,
      id: newTodo._id,
    };
  },

  async update(id, changes) {
    const updated = await apiClient.put(`/api/todos/${id}`, changes);
    return {
      ...updated,
      id: updated._id,
    };
  },

  async delete(id) {
    await apiClient.delete(`/api/todos/${id}`);
  },
};

export default todosAPI;
