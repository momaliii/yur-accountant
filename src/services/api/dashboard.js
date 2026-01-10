import apiClient from './client';

export const dashboardService = {
  async getLayout() {
    const response = await apiClient.get('/api/dashboard/layout');
    return response.layout;
  },

  async saveLayout(layout) {
    const response = await apiClient.put('/api/dashboard/layout', {
      widgets: layout.widgets || [],
      layout: layout.layout || {},
    });
    return response.layout;
  },

  async getWidgetTypes() {
    const response = await apiClient.get('/api/dashboard/widgets');
    return response.widgets;
  },
};

export default dashboardService;
