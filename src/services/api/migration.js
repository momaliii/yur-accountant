import apiClient from './client.js';

const migrationAPI = {
  async upload(data) {
    const result = await apiClient.post('/api/migration/upload', data);
    return result;
  },
};

export default migrationAPI;
