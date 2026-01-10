import apiClient from './client.js';

const migrationAPI = {
  async upload(data) {
    const result = await apiClient.post('/api/migration/upload', data);
    return result;
  },
  
  async clearAll() {
    const result = await apiClient.delete('/api/migration/clear');
    return result;
  },
};

export default migrationAPI;
