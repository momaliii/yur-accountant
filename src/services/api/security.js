import apiClient from './client';

export const securityService = {
  // Sessions
  async getSessions() {
    return await apiClient.get('/api/security/sessions');
  },

  async revokeSession(sessionId) {
    return await apiClient.delete(`/api/security/sessions/${sessionId}`);
  },

  // Audit Logs
  async getAuditLogs(page = 1, limit = 50, filters = {}) {
    return await apiClient.get('/api/security/audit-logs', {
      params: { page, limit, ...filters },
    });
  },

  // GDPR
  async recordConsent(consentGiven) {
    return await apiClient.post('/api/security/consent', { consentGiven });
  },

  async exportData() {
    return await apiClient.get('/api/security/export-data');
  },

  async deleteAccount(password, confirm) {
    return await apiClient.delete('/api/security/delete-account', {
      body: { password, confirm },
    });
  },
};

export default securityService;
